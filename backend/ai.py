"""
AI Intelligence Engine for Future Classroom Simulator.

This module handles:
- Personality-driven student response generation via Gemini 2.0 Flash
- Structured memory management per student
- Evidence-based teacher evaluation
- Personality-aware fallback templates

Uses the `google.genai` SDK (NOT the deprecated google.generativeai).
"""

import os
import json
import random
import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session as DBSession
from models import StudentState
from personality import (
    STUDENT_PERSONALITIES,
    get_student_memory,
    update_student_memory,
    format_memory_for_prompt,
    get_grade_key,
)


# ──────────────────────────────────────────────────────────────────────────────
# GEMINI CLIENT (Dynamic — checks env var every call, never frozen at startup)
# ──────────────────────────────────────────────────────────────────────────────

def _get_gemini_client():
    """Returns a configured Gemini client, or None if no API key is set."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        from google import genai as google_genai
        return google_genai.Client(api_key=api_key)
    except Exception as e:
        print(f"[Gemini Client Init Error]: {e}")
        return None


def _has_api_key() -> bool:
    return bool(os.environ.get("GEMINI_API_KEY"))


# ──────────────────────────────────────────────────────────────────────────────
# JSON RESPONSE CLEANER
# ──────────────────────────────────────────────────────────────────────────────

def clean_json_response(response_text: str) -> str:
    """Cleans markdown formatting from Gemini outputs (e.g. ```json ... ```)."""
    cleaned = response_text.strip()
    cleaned = re.sub(r"^```(?:json)?", "", cleaned)
    cleaned = re.sub(r"```$", "", cleaned)
    return cleaned.strip()


# ──────────────────────────────────────────────────────────────────────────────
# PERSONALITY-DRIVEN PROMPT BUILDER (The Core Innovation)
# ──────────────────────────────────────────────────────────────────────────────

def _build_personality_prompt(
    student_name: str,
    personality_profile: Dict[str, Any],
    state: StudentState,
    memory: Dict[str, Any],
    classroom_state: Dict[str, Any],
    teacher_message: str,
    conversation_history: List[Dict[str, str]],
    session_info: Dict[str, str],
) -> str:
    """
    Builds a UNIQUE prompt for each student based on their personality DNA.
    This is what makes Aarav, Ananya, and Kabir respond completely differently.
    """
    traits = personality_profile["traits"]
    patterns = personality_profile["speech_patterns"]
    rules = personality_profile["behavior_rules"]
    grade_key = get_grade_key(session_info["class_level"])
    grade_style = personality_profile["grade_adaptation"].get(grade_key, "")

    # Format memory context
    memory_context = format_memory_for_prompt(memory)

    # Format recent conversation (last 8 turns)
    history_lines = []
    for msg in conversation_history[-8:]:
        sender = msg.get("sender_name", msg.get("sender_type", "Unknown"))
        text = msg.get("message_text", "")
        history_lines.append(f"  {sender}: {text}")
    history_str = "\n".join(history_lines) if history_lines else "  (Class just started, no conversation yet)"

    # Build speech patterns string
    patterns_str = "\n".join(f"  • {p}" for p in patterns)

    # Build behavior rules string
    rules_str = "\n".join(f"  • {r}" for r in rules)

    return f"""You are {student_name}, a REAL {grade_key} school student in an Indian classroom.
You are NOT an AI. You are a specific child with specific habits, fears, quirks, and ways of talking.

═══ YOUR PERSONALITY DNA (this defines WHO you are — never break character) ═══
Role: {personality_profile["role"]}
Curiosity: {traits["curiosity"]}/100
Confidence: {traits["confidence"]}/100
Current Attention: {state.attention_level}/100
Current Confusion: {state.confusion_level}/100
Current Understanding: {state.understanding_level}/100
Times you've spoken today: {state.participation_count}

═══ HOW YOU TALK (copy these speech patterns EXACTLY) ═══
{patterns_str}

═══ YOUR BEHAVIOR RULES (follow these strictly) ═══
{rules_str}

═══ FOR GRADE LEVEL: {session_info["class_level"]} ═══
{grade_style}

═══ WHAT YOU REMEMBER FROM THIS CLASS ═══
{memory_context}

═══ CLASSROOM RIGHT NOW ═══
Subject: {session_info["subject"]} | Topic: {session_info["topic"]}
Turn #{classroom_state["turn_number"]} | Energy: {classroom_state["energy_level"]}
Class avg attention: {classroom_state["avg_class_attention"]}% | Class avg confusion: {classroom_state["avg_class_confusion"]}%

═══ RECENT CONVERSATION ═══
{history_str}

═══ TEACHER JUST SAID ═══
"{teacher_message}"

═══ ABSOLUTE RULES (violating these = failure) ═══
1. You ARE {student_name}. Your personality traits above define your EXACT behavior. Do NOT act like any other student.
2. Keep response to 1-2 sentences MAX. Real kids don't give speeches or lectures.
3. Use the speech patterns listed above. Do NOT use formal/academic language like "fascinating", "correlation", "phenomenon".
4. Check "WHAT YOU REMEMBER" — NEVER repeat something you already said. NEVER ask about something already explained.
5. If your attention is below 40 → you might zone out, give off-topic response, or say "huh?"
6. If your confusion is above 60 → express genuine confusion in your character's way.
7. If teacher said a greeting → greet back in YOUR character's style. Don't start discussing the topic.
8. If teacher asked a question → attempt to answer (correctly/incorrectly based on your personality and understanding level).
9. Language: {session_info["language"]}. Use Devanagari for Hindi, Bengali script for Bengali, English for English.

Return ONLY raw JSON (no markdown, no ```json, just the object):
{{
    "response_text": "your 1-2 sentence response as {student_name}",
    "emotion": "normal|confused|questioning|sleeping|distracted|talking",
    "attention_change": -20 to +20,
    "confidence_change": -15 to +15,
    "understanding_change": -15 to +15,
    "confusion_change": -15 to +15,
    "memory_update": "one sentence: what {student_name} learned or felt this turn"
}}"""


# ──────────────────────────────────────────────────────────────────────────────
# PERSONALITY-AWARE FALLBACK RESPONSES
# ──────────────────────────────────────────────────────────────────────────────

def _generate_fallback_response(
    student_name: str,
    personality: str,
    teacher_message: str,
    topic: str,
    language: str,
    class_level: str,
    memory: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Generates a personality-aware fallback when Gemini API is unavailable.
    Unlike the old system, each personality type has rich, varied templates
    that incorporate the actual topic and teacher's message.
    """
    t_lower = teacher_message.lower().strip("?!., ")
    topic_clean = topic.strip()
    grade_key = get_grade_key(class_level)

    # Check for greetings
    greetings = [
        "good morning", "good afternoon", "good evening", "hello", "hi", "hey",
        "namaste", "namaskar", "suprabhat", "shubho shokal", "kemon acho",
        "aap kaise hain", "how are you",
    ]
    is_greeting = any(g in t_lower and len(t_lower) < len(g) + 15 for g in greetings)

    # Check for questions
    is_question = teacher_message.strip().endswith("?") or any(
        w in t_lower for w in ["what", "why", "how", "who", "when", "explain", "tell"]
    )

    # Extract a keyword from teacher message for contextual responses
    stop_words = {"the", "a", "an", "is", "are", "was", "were", "in", "on", "at",
                  "to", "for", "of", "and", "or", "but", "it", "this", "that",
                  "what", "why", "how", "can", "you", "we", "do", "does", "did",
                  "tell", "me", "about", "explain", "class", "today", "now"}
    words = [w for w in t_lower.split() if w not in stop_words and len(w) > 2]
    keyword = words[0] if words else topic_clean

    # Avoid repeating last responses
    last_responses = memory.get("last_responses", [])

    # Generate personality-specific response
    if language == "Hindi":
        responses = _hindi_fallback(student_name, personality, is_greeting, is_question, topic_clean, keyword, grade_key)
    elif language == "Bengali":
        responses = _bengali_fallback(student_name, personality, is_greeting, is_question, topic_clean, keyword, grade_key)
    else:
        responses = _english_fallback(student_name, personality, is_greeting, is_question, topic_clean, keyword, grade_key)

    # Filter out any responses that match recent ones
    available = [r for r in responses if r not in last_responses]
    if not available:
        available = responses

    response_text = random.choice(available)

    # Determine emotion
    emotion_map = {
        "Curious student": "questioning",
        "Shy student": random.choice(["normal", "normal", "distracted"]),
        "Distracted student": random.choice(["distracted", "sleeping", "distracted"]),
        "Hyperactive student": "talking",
        "Weak learner": random.choice(["confused", "confused", "normal"]),
        "Overconfident student": "talking",
    }
    emotion = emotion_map.get(personality, "normal")

    return {
        "responding_student": student_name,
        "response_text": response_text,
        "emotion": emotion,
    }


def _english_fallback(name, personality, is_greeting, is_question, topic, keyword, grade):
    """English fallback responses per personality."""
    if is_greeting:
        return {
            "Curious student": [
                f"Good morning, teacher! I was looking up {topic} last night — can't wait!",
                f"Morning! I have so many questions about {topic} already!",
            ],
            "Shy student": [
                "Good morning... (nods quietly)",
                "...morning, teacher. (looks down)",
            ],
            "Distracted student": [
                "Oh! Morning! (scrambles to put notebook away)",
                "Huh? Oh, good morning! Sorry, I was drawing...",
            ],
            "Hyperactive student": [
                f"GOOD MORNING TEACHER!! Are we doing {topic} today?! I'm SO excited!!",
                f"Morning!! Can we start already?! I wanna learn about {topic}!!",
            ],
            "Weak learner": [
                f"Good morning teacher! I hope {topic} won't be too hard today...",
                "Morning! Can we go slow today please?",
            ],
            "Overconfident student": [
                f"Morning! I already studied {topic} — you can quiz me anytime!",
                f"Good morning! Pfft, {topic}? I already know all of this.",
            ],
        }.get(personality, [f"Good morning, teacher!"])

    if is_question:
        return {
            "Curious student": [
                f"Hmm, I think it's related to {keyword}... but wait, what if it's different for other cases?",
                f"Oh! Is it because of {keyword}? I read something about this!",
            ],
            "Shy student": [
                f"Um... maybe... {keyword}...? I'm not sure sorry...",
                "I... I think I know but... (trails off)",
            ],
            "Distracted student": [
                f"Wait, what was the question? Something about {keyword}?",
                "Sorry, I wasn't listening... can you ask again?",
            ],
            "Hyperactive student": [
                f"OH! I KNOW! It's {keyword}!! Right?! RIGHT?!",
                f"PICK ME! It's because of {keyword}!! I saw it on YouTube!",
            ],
            "Weak learner": [
                f"Is it... {keyword}? I'm not really sure what that means though...",
                f"I don't really get {keyword}... can you explain it simpler?",
            ],
            "Overconfident student": [
                f"Obviously it's {keyword}. Everyone knows that. Easy.",
                f"Pfft, the answer is clearly {keyword}. I knew this already.",
            ],
        }.get(personality, [f"I think it might be {keyword}..."])

    # General response to explanation
    return {
        "Curious student": [
            f"But wait, how does {keyword} actually work? Like, what happens inside?",
            f"That's cool! But what if {keyword} was different? Would it change everything?",
        ],
        "Shy student": [
            "...okay... (writes in notebook quietly)",
            f"Um... I think I understand the {keyword} part... maybe...",
        ],
        "Distracted student": [
            f"Wait, are we still on {keyword}? I lost track...",
            "Sorry, what page are we on? I was looking at something...",
        ],
        "Hyperactive student": [
            f"Can we DO something with {keyword}?! Like an experiment?!",
            f"OH that's SO COOL! {keyword} is amazing!! What else?!",
        ],
        "Weak learner": [
            f"Teacher, I'm lost... what is {keyword} again?",
            f"Can you explain {keyword} with a simple example? I don't get it...",
        ],
        "Overconfident student": [
            f"Yeah, I already knew about {keyword}. My brother told me last week.",
            f"That's basic stuff. {keyword} is easy — what's next?",
        ],
    }.get(personality, [f"I see, so it's about {keyword}..."])


def _hindi_fallback(name, personality, is_greeting, is_question, topic, keyword, grade):
    """Hindi fallback responses per personality."""
    if is_greeting:
        return {
            "Curious student": [f"सुप्रभात शिक्षक! {topic} के बारे में बहुत excited हूँ!", f"नमस्ते! आज {topic} पढ़ेंगे ना? मैंने कल रात कुछ पढ़ा!"],
            "Shy student": ["नमस्ते... (धीरे से सिर झुकाती है)", "...सुप्रभात सर। (नीचे देखती है)"],
            "Distracted student": ["अरे! सुप्रभात! (जल्दी से कॉपी बंद करता है)", "ओह! नमस्ते सर! माफ़ करना, मैं drawing कर रहा था..."],
            "Hyperactive student": [f"सुप्रभात शिक्षक जी!! आज {topic} में experiment करेंगे?! बहुत excited हूँ!!", f"नमस्ते!! शुरू करें ना!! {topic} सीखना है!!"],
            "Weak learner": [f"सुप्रभात सर! उम्मीद है आज {topic} ज़्यादा मुश्किल नहीं होगा...", "नमस्ते! आज धीरे-धीरे पढ़ाइएगा प्लीज़?"],
            "Overconfident student": [f"सुप्रभात! मैंने {topic} कल ही पढ़ लिया — कोई भी सवाल पूछ लीजिए!", f"नमस्ते! {topic}? यह तो बहुत आसान है!"],
        }.get(personality, ["सुप्रभात शिक्षक जी!"])

    if is_question:
        return {
            "Curious student": [f"मुझे लगता है यह {keyword} से जुड़ा है... लेकिन रुकिए, अगर अलग situation हो तो?", f"ओह! क्या यह {keyword} की वजह से होता है?"],
            "Shy student": [f"उम... शायद... {keyword}...? मुझे पक्का नहीं पता... माफ़ कीजिए...", "मुझे... मुझे लगता है पता है पर... (चुप हो जाती है)"],
            "Distracted student": [f"रुकिए, सवाल क्या था? {keyword} के बारे में कुछ?", "माफ़ करना, मैं सुन नहीं रहा था... दोबारा पूछेंगे?"],
            "Hyperactive student": [f"सर! मुझे पता है! {keyword}!! है ना?! है ना?!", f"मुझे choose करो! {keyword} की वजह से! YouTube पर देखा था!"],
            "Weak learner": [f"क्या यह... {keyword} है? मुझे सच में समझ नहीं आया...", f"{keyword} का मतलब क्या है? आसान शब्दों में बताइए ना..."],
            "Overconfident student": [f"बिल्कुल {keyword} है। सबको पता है। बहुत आसान।", f"इसका जवाब तो {keyword} है। मुझे पहले से पता था।"],
        }.get(personality, [f"शायद {keyword}... मुझे नहीं पता"])

    return {
        "Curious student": [f"लेकिन रुकिए, {keyword} अंदर से कैसे काम करता है?", f"यह तो मज़ेदार है! अगर {keyword} अलग हो तो क्या होगा?"],
        "Shy student": ["...ठीक है... (चुपचाप कॉपी में लिखती है)", f"उम... मुझे {keyword} वाला हिस्सा समझ आया... शायद..."],
        "Distracted student": [f"रुकिए, हम अभी भी {keyword} पर हैं? मैं भूल गया...", "माफ़ करना, कौन सा page है? मैं कुछ और देख रहा था..."],
        "Hyperactive student": [f"क्या हम {keyword} के साथ कुछ बना सकते हैं?! Experiment!!", f"यह तो बहुत COOL है! {keyword} amazing है!!"],
        "Weak learner": [f"सर, मैं confused हूँ... {keyword} क्या है?", f"क्या {keyword} को आसान example से समझा सकते हैं?"],
        "Overconfident student": [f"हाँ, मुझे {keyword} पहले से पता है। भाई ने बताया था।", f"यह तो basic है। {keyword} आसान है — आगे बढ़िए।"],
    }.get(personality, [f"हम्म, तो {keyword} के बारे में..."])


def _bengali_fallback(name, personality, is_greeting, is_question, topic, keyword, grade):
    """Bengali fallback responses per personality."""
    if is_greeting:
        return {
            "Curious student": [f"শুভ সকাল স্যার! {topic} নিয়ে খুব excited!", f"নমস্কার! আজ {topic} পড়ব তো?"],
            "Shy student": ["নমস্কার... (ধীরে মাথা নিচু করে)", "...শুভ সকাল স্যার। (নিচে তাকিয়ে)"],
            "Distracted student": ["ওহ! শুভ সকাল! (তাড়াতাড়ি খাতা বন্ধ করে)", "নমস্কার স্যার! মাফ করবেন, আঁকছিলাম..."],
            "Hyperactive student": [f"শুভ সকাল স্যার!! {topic} নিয়ে experiment করব?! খুব excited!!", f"নমস্কার!! শুরু করি!! {topic} শিখতে চাই!!"],
            "Weak learner": [f"শুভ সকাল স্যার! আশা করি {topic} খুব কঠিন হবে না...", "নমস্কার! আজ আস্তে আস্তে পড়াবেন প্লিজ?"],
            "Overconfident student": [f"শুভ সকাল! {topic} গতকালই পড়ে ফেলেছি — যেকোনো প্রশ্ন করুন!", f"নমস্কার! {topic}? এটা তো খুব সহজ!"],
        }.get(personality, ["শুভ সকাল স্যার!"])

    if is_question:
        return {
            "Curious student": [f"আমার মনে হয় এটা {keyword}-এর সাথে জড়িত... কিন্তু অন্য situation-এ?", f"ওহ! এটা কি {keyword}-এর জন্য হয়?"],
            "Shy student": [f"উম... হয়তো... {keyword}...? আমি নিশ্চিত নই... দুঃখিত...", "আমার... মনে হয় জানি কিন্তু... (চুপ হয়ে যায়)"],
            "Distracted student": [f"দাঁড়ান, প্রশ্নটা কী ছিল? {keyword} নিয়ে?", "মাফ করবেন, শুনছিলাম না... আবার বলবেন?"],
            "Hyperactive student": [f"স্যার! আমি জানি! {keyword}!! তাই না?! তাই না?!", f"আমাকে বলতে দিন! {keyword}! YouTube-এ দেখেছিলাম!"],
            "Weak learner": [f"এটা কি... {keyword}? আমি সত্যিই বুঝতে পারছি না...", f"{keyword} মানে কী? সহজ করে বলুন না..."],
            "Overconfident student": [f"অবশ্যই {keyword}। সবাই জানে। খুব সহজ।", f"উত্তর তো {keyword}। আমি আগেই জানতাম।"],
        }.get(personality, [f"হয়তো {keyword}..."])

    return {
        "Curious student": [f"কিন্তু দাঁড়ান, {keyword} ভেতরে কীভাবে কাজ করে?", f"মজার! {keyword} যদি আলাদা হত তাহলে কী হত?"],
        "Shy student": ["...ঠিক আছে... (চুপচাপ খাতায় লেখে)", f"উম... {keyword} অংশটা বুঝেছি... মনে হয়..."],
        "Distracted student": [f"দাঁড়ান, এখনো {keyword} নিয়ে? ভুলে গেছি...", "মাফ করবেন, কোন পেজ? অন্যকিছু দেখছিলাম..."],
        "Hyperactive student": [f"{keyword} দিয়ে কিছু বানাতে পারি?! Experiment!!", f"এটা তো দারুণ! {keyword} অসাধারণ!!"],
        "Weak learner": [f"স্যার, confused... {keyword} কী?", f"{keyword} সহজ example দিয়ে বোঝাবেন?"],
        "Overconfident student": [f"হ্যাঁ, {keyword} আমি আগে থেকেই জানি। দাদা বলেছিল।", f"এটা basic। {keyword} সহজ — পরেরটা বলুন।"],
    }.get(personality, [f"হুম, {keyword} সম্পর্কে..."])


# ──────────────────────────────────────────────────────────────────────────────
# MAIN STUDENT REPLY GENERATOR
# ──────────────────────────────────────────────────────────────────────────────

async def generate_student_reply(
    session_id: int,
    db: DBSession,
    subject: str,
    topic: str,
    class_level: str,
    objectives: str,
    method: str,
    language: str,
    student_name: str,
    student_personality: str,
    teacher_message: str,
    conversation_history: List[Dict[str, str]],
    active_event: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generates a student response using personality-driven prompts.
    Uses Gemini 2.0 Flash with per-student personality profiles.
    Falls back to personality-aware templates if API is unavailable.
    """
    language = str(language).strip().title()

    # Get or create student state
    state_rec = db.query(StudentState).filter(
        StudentState.session_id == session_id,
        StudentState.student_name == student_name,
    ).first()

    if not state_rec:
        # Initialize with personality-driven defaults
        personality_profile = STUDENT_PERSONALITIES.get(student_name, {})
        traits = personality_profile.get("traits", {})
        state_rec = StudentState(
            session_id=session_id,
            student_name=student_name,
            attention_level=traits.get("attention_base", 75),
            confidence_level=traits.get("confidence", 65),
            understanding_level=75,
            confusion_level=traits.get("confusion_base", 25),
            curiosity_level=traits.get("curiosity", 50),
            interrupt_probability=traits.get("interrupt_probability", 20),
            memory_summary=f"Class started. Topic: {topic}.",
            memory_json=json.dumps({
                "concepts_taught": [],
                "questions_asked_by_student": [],
                "questions_received_from_teacher": [],
                "key_interactions": [],
                "last_responses": [],
            }),
            participation_count=0,
        )
        db.add(state_rec)
        db.commit()
        db.refresh(state_rec)

    # Get structured memory
    memory = get_student_memory(state_rec)

    # Get personality profile
    personality_profile = STUDENT_PERSONALITIES.get(student_name)

    # Session info
    session_info = {
        "subject": subject,
        "topic": topic,
        "class_level": class_level,
        "objectives": objectives,
        "method": method,
        "language": language,
    }

    # Compute classroom state
    all_states = db.query(StudentState).filter(
        StudentState.session_id == session_id
    ).all()
    turn_number = len(conversation_history)

    from personality import compute_classroom_state
    classroom_state = compute_classroom_state(
        turn_number=turn_number,
        session_duration_minutes=15,
        student_states=all_states,
    )

    # ── Try Gemini API ──
    gemini_client = _get_gemini_client()

    if gemini_client and personality_profile:
        try:
            prompt = _build_personality_prompt(
                student_name=student_name,
                personality_profile=personality_profile,
                state=state_rec,
                memory=memory,
                classroom_state=classroom_state,
                teacher_message=teacher_message,
                conversation_history=conversation_history,
                session_info=session_info,
            )

            print(f"[AI] Generating reply for {student_name} ({student_personality}) via Gemini...")
            response = gemini_client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
            )
            response_content = response.text
            print(f"[AI] Raw response: {response_content[:200]}...")

            cleaned = clean_json_response(response_content)
            parsed = json.loads(cleaned)
            print(f"[AI] Parsed: student={student_name}, emotion={parsed.get('emotion')}, text={parsed.get('response_text', '')[:80]}...")

            # Update student state from AI deltas
            state_rec.attention_level = max(0, min(100,
                state_rec.attention_level + parsed.get("attention_change", 0)))
            state_rec.confidence_level = max(0, min(100,
                state_rec.confidence_level + parsed.get("confidence_change", 0)))
            state_rec.understanding_level = max(0, min(100,
                state_rec.understanding_level + parsed.get("understanding_change", 0)))
            state_rec.confusion_level = max(0, min(100,
                state_rec.confusion_level + parsed.get("confusion_change", 0)))
            state_rec.participation_count += 1

            # Update legacy memory summary
            if parsed.get("memory_update"):
                state_rec.memory_summary = parsed["memory_update"]

            # Update structured memory
            update_student_memory(
                state=state_rec,
                memory=memory,
                response_text=parsed.get("response_text", ""),
                teacher_message=teacher_message,
                memory_update_text=parsed.get("memory_update", ""),
                turn_number=turn_number,
            )

            db.commit()

            return {
                "responding_student": student_name,
                "response_text": parsed.get("response_text", ""),
                "emotion": parsed.get("emotion", "normal"),
            }

        except Exception as e:
            print(f"[AI] Gemini error for {student_name}, falling back: {e}")
            # Fall through to fallback

    # ── Fallback: Personality-aware template responses ──
    print(f"[AI] Using fallback for {student_name} (no API or error)")
    fallback = _generate_fallback_response(
        student_name=student_name,
        personality=student_personality,
        teacher_message=teacher_message,
        topic=topic,
        language=language,
        class_level=class_level,
        memory=memory,
    )

    # Update memory even in fallback
    update_student_memory(
        state=state_rec,
        memory=memory,
        response_text=fallback["response_text"],
        teacher_message=teacher_message,
        memory_update_text=f"Responded to teacher about {topic}",
        turn_number=turn_number,
    )
    state_rec.participation_count += 1
    db.commit()

    return fallback


# ──────────────────────────────────────────────────────────────────────────────
# EVIDENCE-BASED EVALUATION SYSTEM
# ──────────────────────────────────────────────────────────────────────────────

def _compute_session_metrics(
    transcript: List[Dict[str, str]],
    student_states: List[StudentState],
) -> Dict[str, Any]:
    """
    Computes real, evidence-based metrics from the actual session data.
    These numbers are REAL — computed from DB records, not guessed by an LLM.
    """
    teacher_messages = [m for m in transcript if m["sender_type"] == "teacher"]
    student_messages = [m for m in transcript if m["sender_type"] == "student"]
    system_messages = [m for m in transcript if m["sender_type"] == "system"]

    teacher_words = sum(len(m["message_text"].split()) for m in teacher_messages)
    student_words = sum(len(m["message_text"].split()) for m in student_messages)
    total_words = teacher_words + student_words

    # Unique students who spoke
    unique_speakers = set(m["sender_name"] for m in student_messages)
    all_students = {"Aarav", "Ananya", "Vihaan", "Ishaan", "Riya", "Kabir"}
    never_addressed = all_students - unique_speakers

    # Students mentioned by teacher
    addressed_by_teacher = set()
    teacher_questions = 0
    for m in teacher_messages:
        text_lower = m["message_text"].lower()
        if text_lower.strip().endswith("?") or any(w in text_lower for w in ["what", "why", "how", "who"]):
            teacher_questions += 1
        for name in all_students:
            if name.lower() in text_lower:
                addressed_by_teacher.add(name)

    # Student state averages
    avg_attention = sum(s.attention_level for s in student_states) / max(1, len(student_states))
    avg_confusion = sum(s.confusion_level for s in student_states) / max(1, len(student_states))
    avg_understanding = sum(s.understanding_level for s in student_states) / max(1, len(student_states))

    # Most/least engaged
    most_engaged = max(student_states, key=lambda s: s.participation_count).student_name if student_states else "N/A"
    most_confused = max(student_states, key=lambda s: s.confusion_level).student_name if student_states else "N/A"
    least_engaged = min(student_states, key=lambda s: s.participation_count).student_name if student_states else "N/A"

    return {
        "total_turns": len(transcript),
        "teacher_turns": len(teacher_messages),
        "student_turns": len(student_messages),
        "events_triggered": len(system_messages),
        "teacher_speaking_pct": round(teacher_words / max(1, total_words) * 100, 1),
        "student_speaking_pct": round(student_words / max(1, total_words) * 100, 1),
        "teacher_word_count": teacher_words,
        "student_word_count": student_words,
        "unique_students_engaged": len(unique_speakers),
        "students_never_addressed": list(never_addressed),
        "students_addressed_by_teacher": list(addressed_by_teacher),
        "teacher_questions_asked": teacher_questions,
        "avg_student_attention": round(avg_attention, 1),
        "avg_student_confusion": round(avg_confusion, 1),
        "avg_student_understanding": round(avg_understanding, 1),
        "most_engaged_student": most_engaged,
        "most_confused_student": most_confused,
        "least_engaged_student": least_engaged,
    }


async def generate_evaluation(
    subject: str,
    topic: str,
    class_level: str,
    objectives: str,
    method: str,
    language: str,
    transcript: List[Dict[str, str]],
    student_states: Optional[List[StudentState]] = None,
) -> Dict[str, Any]:
    """
    Evaluates the teaching session using evidence-based metrics.
    Passes REAL data to Gemini so scores are grounded in actual performance.
    """
    # Compute real metrics
    metrics = _compute_session_metrics(transcript, student_states or [])

    # Build transcript string
    transcript_str = "\n".join(
        f"{m['sender_name']} ({m['sender_type']}): {m['message_text']}"
        for m in transcript
    )

    # Short session shortcut
    if metrics["teacher_turns"] < 3:
        return {
            "communication_score": 90,
            "engagement_score": 90,
            "time_management_score": 90,
            "question_handling_score": 90,
            "suggestions": (
                "### Great Start!\n"
                "This was a quick introductory session. You welcomed the class warmly! "
                "To get detailed B.Ed pedagogical feedback, continue the lesson by "
                "explaining concepts, asking questions, and engaging different students."
            ),
            "transcript_summary": f"Brief introduction for {subject} ({topic}). Teacher established positive rapport.",
        }

    # Try Gemini
    gemini_client = _get_gemini_client()
    if gemini_client:
        try:
            prompt = f"""You are a B.Ed Teacher Training Assessor. Evaluate this virtual classroom session.

SESSION: {subject} — {topic} (Grade: {class_level})
Objectives: {objectives}
Method: {method}

═══ REAL SESSION METRICS (computed from actual data — use these, don't invent numbers) ═══
Total turns: {metrics["total_turns"]}
Teacher turns: {metrics["teacher_turns"]} | Student turns: {metrics["student_turns"]}
Teacher speaking: {metrics["teacher_speaking_pct"]}% | Student speaking: {metrics["student_speaking_pct"]}%
Teacher word count: {metrics["teacher_word_count"]}
Questions asked by teacher: {metrics["teacher_questions_asked"]}
Unique students who spoke: {metrics["unique_students_engaged"]}/6
Students never addressed: {', '.join(metrics["students_never_addressed"]) or 'None — great!'}
Students addressed by teacher: {', '.join(metrics["students_addressed_by_teacher"]) or 'None'}
Events triggered: {metrics["events_triggered"]}
Avg student attention: {metrics["avg_student_attention"]}%
Avg student confusion: {metrics["avg_student_confusion"]}%
Avg student understanding: {metrics["avg_student_understanding"]}%
Most engaged: {metrics["most_engaged_student"]}
Most confused: {metrics["most_confused_student"]}
Least engaged: {metrics["least_engaged_student"]}

═══ TRANSCRIPT ═══
{transcript_str}

═══ SCORING RULES ═══
Base your scores on the REAL METRICS above, not on feelings:
- Communication (0-100): Clarity, grade-appropriate language, explanation quality.
  If teacher used complex jargon for primary students, deduct heavily.
- Engagement (0-100): Based on unique_students_engaged and students_addressed.
  {metrics["unique_students_engaged"]}/6 students spoke. {'Students never addressed: ' + ', '.join(metrics["students_never_addressed"]) + ' — deduct for each unengaged student.' if metrics["students_never_addressed"] else 'All students engaged — bonus points!'}
- Time Management (0-100): Teacher speaking was {metrics["teacher_speaking_pct"]}%.
  Ideal is 40-50% teacher, 50-60% student. Penalize if teacher > 70%.
- Question Handling (0-100): Teacher asked {metrics["teacher_questions_asked"]} questions.
  Was the teacher patient with confused students? Did they address the most confused student ({metrics["most_confused_student"]})?

Return ONLY raw JSON:
{{
    "communication_score": integer 0-100,
    "engagement_score": integer 0-100,
    "time_management_score": integer 0-100,
    "question_handling_score": integer 0-100,
    "suggestions": "detailed markdown: strengths, weaknesses, specific B.Ed pedagogical advice with references to actual metrics",
    "transcript_summary": "2-3 sentence factual summary"
}}"""

            response = gemini_client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
            )
            cleaned = clean_json_response(response.text)
            return json.loads(cleaned)

        except Exception as e:
            print(f"[Evaluation] Gemini error: {e}")

    # ── Rule-based fallback using real metrics ──
    m = metrics

    # Communication: penalize if teacher talks too much
    comm = 75
    if m["teacher_speaking_pct"] < 60:
        comm += 10
    if m["teacher_questions_asked"] > 2:
        comm += 5

    # Engagement: based on unique students
    eng = 40 + m["unique_students_engaged"] * 10

    # Time management
    time_score = 80
    if m["teacher_speaking_pct"] > 75:
        time_score -= 15
    if m["total_turns"] > 6:
        time_score += 5

    # Question handling
    q_score = 60 + min(20, m["teacher_questions_asked"] * 5)
    if "Riya" in m["students_addressed_by_teacher"]:
        q_score += 5
    if "Aarav" in m["students_addressed_by_teacher"]:
        q_score += 5

    # Cap scores
    comm = min(98, max(30, comm))
    eng = min(98, max(30, eng))
    time_score = min(98, max(30, time_score))
    q_score = min(98, max(30, q_score))

    suggestions_parts = [
        f"### Session Analysis\n",
        f"**Teacher speaking time:** {m['teacher_speaking_pct']}% (ideal: 40-50%)",
        f"**Student participation:** {m['unique_students_engaged']}/6 students spoke",
        f"**Questions asked:** {m['teacher_questions_asked']}",
    ]

    if m["students_never_addressed"]:
        suggestions_parts.append(
            f"\n**⚠ Students never engaged:** {', '.join(m['students_never_addressed'])}. "
            "Try calling on these students by name in future sessions."
        )

    if m["avg_student_confusion"] > 40:
        suggestions_parts.append(
            f"\n**⚠ High confusion ({m['avg_student_confusion']}%):** "
            f"Student {m['most_confused_student']} was most confused. "
            "Consider using simpler analogies and checking understanding more frequently."
        )

    suggestions_parts.append(
        "\n**Recommendation:** Aim for 40% teacher talk, 60% student interaction. "
        "Address each student by name at least once per session."
    )

    return {
        "communication_score": int(comm),
        "engagement_score": int(eng),
        "time_management_score": int(time_score),
        "question_handling_score": int(q_score),
        "suggestions": "\n".join(suggestions_parts),
        "transcript_summary": (
            f"Session on {subject} ({topic}) for {class_level}. "
            f"{m['teacher_turns']} teacher turns, {m['student_turns']} student responses, "
            f"{m['unique_students_engaged']}/6 students engaged."
        ),
    }
