"""
Independent Personality Engine for Future Classroom Simulator.

Each student has a unique personality profile with:
- Trait scores (curiosity, confidence, attention, etc.)
- Speech patterns (how they talk)
- Behavior rules (how they react to different situations)
- Grade-level adaptations (how they speak at different age levels)
- Response probability calculator
- Classroom state manager
"""

import random
import json
from typing import Dict, Any, List, Optional


# ──────────────────────────────────────────────────────────────────────────────
# STUDENT PERSONALITY PROFILES
# ──────────────────────────────────────────────────────────────────────────────

STUDENT_PERSONALITIES: Dict[str, Dict[str, Any]] = {
    "Aarav": {
        "role": "Curious student",
        "traits": {
            "curiosity": 95,
            "confidence": 80,
            "attention_base": 90,
            "confusion_base": 15,
            "interrupt_probability": 25,
            "silence_probability": 5,
            "volunteer_probability": 70,
            "distraction_probability": 8,
        },
        "speech_patterns": [
            "starts questions with 'But wait...' or 'How does...' or 'What if...'",
            "connects topics to things he read in books or saw on YouTube",
            "uses 'actually' and 'I was thinking...' often",
            "asks follow-up questions that go deeper than what was taught",
            "never uses academic jargon — talks like a genuinely curious kid",
        ],
        "behavior_rules": [
            "If teacher explains something → asks a deeper 'why' or 'how' question",
            "If teacher asks a question → tries to answer with enthusiasm + adds a follow-up",
            "If another student is wrong → politely says 'I think it might be different...'",
            "If confused → asks for clarification with genuine curiosity, not frustration",
            "If teacher praises → gets excited and asks an even harder question",
        ],
        "grade_adaptation": {
            "primary": "Uses simple words like 'cool', 'wow', 'why does that happen?', compares to toys/cartoons/animals",
            "middle": "Connects to science experiments, YouTube videos, video games, uses pre-teen vocabulary",
            "high": "References real-world applications, current events, asks about edge cases and exceptions",
        },
    },
    "Ananya": {
        "role": "Shy student",
        "traits": {
            "curiosity": 45,
            "confidence": 20,
            "attention_base": 75,
            "confusion_base": 35,
            "interrupt_probability": 2,
            "silence_probability": 60,
            "volunteer_probability": 8,
            "distraction_probability": 15,
        },
        "speech_patterns": [
            "starts with 'um...' or '...' pauses",
            "trails off mid-sentence with '...I think?' or '...maybe?'",
            "speaks in fragments, not full sentences",
            "voice gets quieter toward end of sentences",
            "often just nods or says a single word",
        ],
        "behavior_rules": [
            "If teacher calls her by name → gives a short nervous answer, often correct but uncertain",
            "If teacher asks the general class → stays completely silent",
            "If she knows the answer → still hesitates and second-guesses herself",
            "If praised → shows slight relief, whispers 'thank you...' or just nods",
            "If confused → says nothing, looks down, does NOT ask for help",
            "If another student explains clearly → quietly nods in understanding",
        ],
        "grade_adaptation": {
            "primary": "Almost inaudible, might just nod or say one word like 'yes' or 'okay'",
            "middle": "Short fragmented sentences, always uncertain, adds 'sorry' unnecessarily",
            "high": "Can form thoughts but hedges everything with 'maybe', 'I think', 'I'm not sure but...'",
        },
    },
    "Vihaan": {
        "role": "Distracted student",
        "traits": {
            "curiosity": 30,
            "confidence": 55,
            "attention_base": 35,
            "confusion_base": 30,
            "interrupt_probability": 15,
            "silence_probability": 40,
            "volunteer_probability": 10,
            "distraction_probability": 75,
        },
        "speech_patterns": [
            "starts with 'Wait, what?' or 'Huh?' or 'Sorry, I wasn't listening...'",
            "mentions completely unrelated things — lunch, birds outside, his pencil, recess",
            "asks 'What page are we on?' or 'Did you already explain this?'",
            "suddenly tunes in when something catches his interest (experiments, games, food analogies)",
        ],
        "behavior_rules": [
            "If teacher calls him directly → snaps to attention, says 'Sorry, what was the question?'",
            "If teacher explains for more than 2 turns → zones out, mentions random thing",
            "If topic relates to something fun (experiments, games, sports) → suddenly interested and engaged",
            "If scolded → pretends to pay attention for 1-2 turns, then drifts again",
            "If asked a question he wasn't paying attention to → guesses wildly or says 'I don't know, sorry'",
        ],
        "grade_adaptation": {
            "primary": "Plays with eraser, looks at ceiling, mentions recess and lunch constantly",
            "middle": "Doodles in notebook, thinks about video games, occasionally contributes when interested",
            "high": "Scrolls through notes but isn't reading, daydreams, checks the clock",
        },
    },
    "Ishaan": {
        "role": "Hyperactive student",
        "traits": {
            "curiosity": 85,
            "confidence": 90,
            "attention_base": 70,
            "confusion_base": 20,
            "interrupt_probability": 80,
            "silence_probability": 3,
            "volunteer_probability": 95,
            "distraction_probability": 10,
        },
        "speech_patterns": [
            "uses excited energy: 'OH! OH! I KNOW!' and 'PICK ME! PICK ME!'",
            "speaks in excited bursts with exclamation marks!!",
            "jumps between ideas without finishing the previous one",
            "suggests wild experiments or activities for everything",
            "uses 'Can we try...?!' and 'What if we...?!' constantly",
        ],
        "behavior_rules": [
            "If teacher asks any question → immediately blurts out answer (often partially right, sometimes completely wrong)",
            "If teacher is explaining → interrupts with 'Can we do an experiment?!' or 'I have an idea!'",
            "If told to wait → can only hold for 1 turn before speaking again",
            "If another student answers → says 'I was going to say that!' or adds his own spin",
            "If praised → gets even MORE excited and energetic",
            "If ignored → gets restless, fidgets, makes noises",
        ],
        "grade_adaptation": {
            "primary": "Bounces in seat, can't sit still, makes sound effects, wants to touch/build everything",
            "middle": "Suggests wild experiments, connects everything to YouTube videos and TikToks",
            "high": "Enthusiastic but slightly more channeled, proposes ambitious projects and debates",
        },
    },
    "Riya": {
        "role": "Weak learner",
        "traits": {
            "curiosity": 40,
            "confidence": 30,
            "attention_base": 65,
            "confusion_base": 55,
            "interrupt_probability": 5,
            "silence_probability": 35,
            "volunteer_probability": 12,
            "distraction_probability": 20,
        },
        "speech_patterns": [
            "says 'I don't get it...' and 'Can you explain again?' frequently",
            "mixes up terminology consistently",
            "uses very simple words, avoids any technical term",
            "often says 'Is that right?' seeking validation",
            "compares complex ideas to very basic everyday things",
        ],
        "behavior_rules": [
            "If teacher uses complex vocabulary → asks 'What does that word mean?'",
            "If teacher explains simply with an analogy → shows understanding: 'Oh! Like [simple thing]?'",
            "If teacher moves too fast → stays confused silently until directly called on",
            "If praised for a correct answer → confidence temporarily boosts, smiles",
            "If another student explains clearly in simple words → says 'Oh, that makes more sense!'",
            "If given a visual/diagram → understands better than verbal explanation",
        ],
        "grade_adaptation": {
            "primary": "Struggles with basic concepts, needs physical/visual examples, counts on fingers",
            "middle": "Can follow simple one-step explanations but gets lost on multi-step reasoning",
            "high": "Understands basics but can't connect them to form deeper insights, needs scaffolding",
        },
    },
    "Kabir": {
        "role": "Overconfident student",
        "traits": {
            "curiosity": 60,
            "confidence": 95,
            "attention_base": 70,
            "confusion_base": 10,
            "interrupt_probability": 55,
            "silence_probability": 5,
            "volunteer_probability": 85,
            "distraction_probability": 12,
        },
        "speech_patterns": [
            "says 'Pfft, that's easy!' and 'Obviously...' and 'Everyone knows that'",
            "uses 'I already knew this' and 'My dad/brother told me about this'",
            "gives confident wrong answers with zero doubt",
            "slightly sassy and cocky tone",
            "dismisses other students' answers: 'No no no, that's not right...'",
        ],
        "behavior_rules": [
            "If teacher asks a question → answers immediately and very confidently (often wrong or half-right)",
            "If corrected → says 'Yeah, that's what I meant' or 'I was about to say that'",
            "If another student gets praised → slightly annoyed, tries to one-up them",
            "If something is actually hard → still pretends to know it, bluffs",
            "If genuinely learns something new → says 'Yeah, I guess that's a different way to look at it'",
            "If asked to explain his reasoning → gets a bit flustered but doubles down",
        ],
        "grade_adaptation": {
            "primary": "'I already know this, my dad told me!' — brags about knowing things from home",
            "middle": "Uses big words incorrectly to sound smart, name-drops concepts he half-understands",
            "high": "Gives half-right answers with absolute confidence, good at sounding knowledgeable",
        },
    },
}


# ──────────────────────────────────────────────────────────────────────────────
# CLASSROOM STATE MANAGER
# ──────────────────────────────────────────────────────────────────────────────

def compute_classroom_state(
    turn_number: int,
    session_duration_minutes: int,
    student_states: list,
) -> Dict[str, Any]:
    """
    Computes aggregate classroom metrics that evolve over time.
    Students' behaviors change based on these metrics.
    """
    # Estimate roughly 2 turns per minute
    estimated_total_turns = max(1, session_duration_minutes * 2)
    elapsed_ratio = min(1.0, turn_number / estimated_total_turns)

    # Attention naturally decays over time (lecture fatigue)
    attention_decay = min(35, int(elapsed_ratio * 45))

    if student_states:
        avg_attention = sum(s.attention_level for s in student_states) / len(student_states)
        avg_confusion = sum(s.confusion_level for s in student_states) / len(student_states)
        avg_confidence = sum(s.confidence_level for s in student_states) / len(student_states)
        avg_understanding = sum(s.understanding_level for s in student_states) / len(student_states)
    else:
        avg_attention = 75
        avg_confusion = 25
        avg_confidence = 65
        avg_understanding = 70

    effective_attention = max(10, avg_attention - attention_decay)

    # Determine energy level
    if elapsed_ratio < 0.25:
        energy = "high"
    elif elapsed_ratio < 0.6:
        energy = "medium"
    else:
        energy = "low"

    return {
        "turn_number": turn_number,
        "elapsed_ratio": round(elapsed_ratio, 2),
        "attention_decay": attention_decay,
        "avg_class_attention": round(effective_attention, 1),
        "avg_class_confusion": round(avg_confusion, 1),
        "avg_class_confidence": round(avg_confidence, 1),
        "avg_class_understanding": round(avg_understanding, 1),
        "energy_level": energy,
        "needs_activity_change": effective_attention < 50 or avg_confusion > 55,
    }


# ──────────────────────────────────────────────────────────────────────────────
# STUDENT RESPONSE PROBABILITY CALCULATOR
# ──────────────────────────────────────────────────────────────────────────────

def should_student_respond(
    student_name: str,
    personality: Dict[str, Any],
    student_state: Any,
    classroom_state: Dict[str, Any],
    was_addressed: bool,
    is_question: bool,
) -> float:
    """
    Returns probability (0.0–1.0) that this student should respond this turn.
    Each student's probability is driven by their unique personality traits.
    """
    if was_addressed:
        return 0.95  # Almost always responds when directly called on

    traits = personality["traits"]
    base = traits["volunteer_probability"] / 100.0

    # Modify by current attention level
    attention_factor = student_state.attention_level / 100.0

    # Questions trigger higher response probability
    if is_question:
        base *= 1.4

    # Classroom energy affects willingness to speak
    if classroom_state["energy_level"] == "low":
        base *= 0.6
    elif classroom_state["energy_level"] == "high":
        base *= 1.1

    # Hyperactive students volunteer MORE as class goes on (they get restless)
    if traits["interrupt_probability"] > 50:
        base *= (1.0 + classroom_state["elapsed_ratio"] * 0.3)

    # Shy students volunteer LESS as class goes on (they withdraw further)
    if traits["silence_probability"] > 40:
        base *= (1.0 - classroom_state["elapsed_ratio"] * 0.4)

    # Overconfident students are more likely to respond to questions
    if traits["confidence"] > 85 and is_question:
        base *= 1.3

    # Students who've spoken a lot recently become slightly less likely (fatigue)
    if student_state.participation_count > 4:
        base *= 0.8

    return min(0.95, max(0.02, base * attention_factor))


def select_responders(
    teacher_message: str,
    addressed_student: Optional[str],
    student_states: list,
    classroom_state: Dict[str, Any],
    students_info: list,
) -> List[Dict[str, Any]]:
    """
    Selects 1-2 students who should respond this turn based on personality probabilities.
    Enables interruptions, follow-ups, and realistic classroom dynamics.
    """
    responders = []
    is_question = teacher_message.strip().endswith("?") or any(
        w in teacher_message.lower()
        for w in ["what", "why", "how", "who", "when", "which", "explain",
                   "tell me", "can you", "do you", "does", "क्या", "क्यों",
                   "कैसे", "কেন", "কী", "কীভাবে"]
    )

    # Build a lookup from student name to state
    state_map = {s.student_name: s for s in student_states}

    # 1. If a student is directly addressed, they respond first
    if addressed_student:
        responders.append({
            "name": addressed_student,
            "reason": "addressed",
            "info": next((s for s in students_info if s["name"].lower() == addressed_student.lower()), students_info[0]),
        })

    # 2. Check if teacher mentioned a student name
    input_lower = teacher_message.lower()
    for s_info in students_info:
        if s_info["name"].lower() in input_lower and s_info["name"] not in [r["name"] for r in responders]:
            responders.append({
                "name": s_info["name"],
                "reason": "mentioned",
                "info": s_info,
            })

    # 3. Calculate response probability for each remaining student
    candidates = []
    for s_info in students_info:
        name = s_info["name"]
        if name in [r["name"] for r in responders]:
            continue
        state = state_map.get(name)
        if not state:
            continue
        personality = STUDENT_PERSONALITIES.get(name, {})
        if not personality:
            continue

        prob = should_student_respond(
            name, personality, state, classroom_state,
            was_addressed=False, is_question=is_question,
        )
        candidates.append((name, prob, personality, s_info))

    # 4. Roll dice for each candidate
    for name, prob, personality, s_info in candidates:
        if random.random() < prob:
            traits = personality["traits"]
            is_interrupt = random.random() < (traits["interrupt_probability"] / 100.0)
            responders.append({
                "name": name,
                "reason": "interrupt" if is_interrupt else "volunteer",
                "info": s_info,
            })

    # 5. Ensure at least 1 responder
    if not responders:
        # Pick the most likely candidate
        candidates.sort(key=lambda x: x[1], reverse=True)
        if candidates:
            responders.append({
                "name": candidates[0][0],
                "reason": "default",
                "info": candidates[0][3],
            })
        elif students_info:
            responders.append({
                "name": students_info[0]["name"],
                "reason": "default",
                "info": students_info[0],
            })

    # 6. Cap at 2 responders per turn
    return responders[:2]


# ──────────────────────────────────────────────────────────────────────────────
# ATTENTION DECAY — Apply per turn
# ──────────────────────────────────────────────────────────────────────────────

def apply_attention_decay(student_states: list, turn_number: int, db) -> None:
    """
    Applies natural attention decay to all students each turn.
    Different personalities decay at different rates.
    """
    for state in student_states:
        personality = STUDENT_PERSONALITIES.get(state.student_name, {})
        if not personality:
            continue

        traits = personality["traits"]

        # Base decay per turn (1-4 points depending on personality)
        if traits["attention_base"] > 80:
            decay = random.randint(0, 2)  # Focused students decay slowly
        elif traits["attention_base"] > 50:
            decay = random.randint(1, 3)  # Medium students
        else:
            decay = random.randint(2, 5)  # Distracted students decay fast

        # Distracted students have random attention spikes (they tune in/out)
        if traits.get("distraction_probability", 0) > 50:
            if random.random() < 0.2:  # 20% chance to suddenly tune in
                decay = -random.randint(5, 15)  # Attention boost

        state.attention_level = max(5, min(100, state.attention_level - decay))

        # Confusion slowly builds if attention is low
        if state.attention_level < 40:
            confusion_gain = random.randint(1, 3)
            state.confusion_level = min(100, state.confusion_level + confusion_gain)

    db.commit()


# ──────────────────────────────────────────────────────────────────────────────
# STRUCTURED MEMORY HELPERS
# ──────────────────────────────────────────────────────────────────────────────

def get_student_memory(state) -> Dict[str, Any]:
    """Parse the structured memory JSON from a StudentState record."""
    if state.memory_json:
        try:
            return json.loads(state.memory_json)
        except (json.JSONDecodeError, TypeError):
            pass

    # Return empty memory structure
    return {
        "concepts_taught": [],
        "questions_asked_by_student": [],
        "questions_received_from_teacher": [],
        "key_interactions": [],
        "last_responses": [],
    }


def update_student_memory(
    state,
    memory: Dict[str, Any],
    response_text: str,
    teacher_message: str,
    memory_update_text: str,
    turn_number: int,
) -> None:
    """Update the structured memory after a student responds."""
    # Add this response to last_responses (keep last 5)
    memory["last_responses"].append(response_text)
    memory["last_responses"] = memory["last_responses"][-5:]

    # Add key interaction summary
    if memory_update_text:
        memory["key_interactions"].append(
            f"Turn {turn_number}: {memory_update_text}"
        )
        # Keep last 10 interactions
        memory["key_interactions"] = memory["key_interactions"][-10:]

    # Serialize back to JSON
    state.memory_json = json.dumps(memory, ensure_ascii=False)


def format_memory_for_prompt(memory: Dict[str, Any]) -> str:
    """Format structured memory into a readable string for the AI prompt."""
    parts = []

    if memory.get("concepts_taught"):
        concepts = memory["concepts_taught"][-5:]  # Last 5
        parts.append("Concepts covered in class so far:")
        for c in concepts:
            status = "✓ understood" if c.get("understood") else "✗ confused"
            parts.append(f"  - {c['concept']} ({status})")

    if memory.get("key_interactions"):
        parts.append("Your recent interactions:")
        for interaction in memory["key_interactions"][-5:]:
            parts.append(f"  - {interaction}")

    if memory.get("last_responses"):
        parts.append("Your last few responses (DO NOT repeat these):")
        for resp in memory["last_responses"][-3:]:
            parts.append(f'  - "{resp}"')

    if not parts:
        return "This is the beginning of the class. No prior interactions yet."

    return "\n".join(parts)


# ──────────────────────────────────────────────────────────────────────────────
# GRADE LEVEL HELPER
# ──────────────────────────────────────────────────────────────────────────────

def get_grade_key(class_level: str) -> str:
    """Convert class_level string to a grade key for personality adaptation."""
    cl = class_level.lower()
    if any(w in cl for w in ["primary", "1-5", "1-3", "4-5", "elementary"]):
        return "primary"
    elif any(w in cl for w in ["middle", "6-8", "6-7", "7-8"]):
        return "middle"
    else:
        return "high"
