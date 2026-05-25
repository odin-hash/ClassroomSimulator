import os
import json
import random
import re
from typing import Dict, Any, List, Optional
import google.generativeai as genai

# Setup Gemini API key
api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    HAS_API_KEY = True
else:
    HAS_API_KEY = False

# Dictionary of fallback multilingual student dialogues
FALLBACK_DIALOGUES = {
    "English": {
        "Curious student": [
            "Teacher, that's fascinating! How does this concept apply if we change the scale or parameters? Can you explain the correlation?",
            "Could we explain this phenomenon using another theory we learned last week? I would love to know the connection.",
            "That makes sense, but what is the practical, real-world application of this concept in our daily lives?"
        ],
        "Shy student": [
            "Umm... yes, I think I understand... (nods quietly)",
            "I... I think the answer might be related to the topic, but I'm not entirely sure... sorry.",
            "... (Ananya looks down and speaks softly) I am listening, thank you."
        ],
        "Distracted student": [
            "Wait, sorry, what did you say? I was looking at a bird outside...",
            "Oh! Um, yes... could you repeat that? I was just writing something down in my notebook...",
            "Teacher, when is the lunch break? I am getting really hungry."
        ],
        "Hyperactive student": [
            "Ooh! Ooh! Pick me! I know! It's like when you throw a ball and it comes down because of gravity, right? I read that in a book!",
            "I have an idea! We can do a science experiment right now! Can we, teacher? Can we?",
            "That reminds me of this cool YouTube video I saw yesterday where they blew up a watermelon! Can we blow up things?"
        ],
        "Weak learner": [
            "Sir/Ma'am, I am a bit confused. Could you please explain that last part again with a simple example?",
            "I'm trying to follow, but it's going a bit too fast for me. What does that specific term mean?",
            "So... does it mean that when the temperature increases, this happens? Or did I get it backwards?"
        ],
        "Overconfident student": [
            "That's easy! The answer is obviously 100 times that, because everything multiplies under these conditions!",
            "I already know all of this! It's basically just common sense, right? We don't even need to write it down.",
            "The explanation is simple: it works because of magnetism. I'm 100% sure that's correct!"
        ]
    },
    "Hindi": {
        "Curious student": [
            "शिक्षक, यह बहुत दिलचस्प है! यह सिद्धांत कैसे काम करेगा अगर हम इसकी परिस्थितियों को बदल दें? क्या आप इसके संबंध को समझा सकते हैं?",
            "क्या हम पिछले हफ्ते सीखे गए किसी अन्य सिद्धांत से इसे जोड़ सकते हैं? मैं इसका संबंध जानना चाहूँगा।",
            "यह तो समझ आ गया, लेकिन हमारे दैनिक जीवन में इस अवधारणा का वास्तविक उपयोग क्या है?"
        ],
        "Shy student": [
            "उम... हाँ, मुझे लगता है कि समझ आ गया... (धीरे से सिर हिलाती है)",
            "मुझे... मुझे लगता है कि जवाब शायद इसी से जुड़ा है, पर मैं पक्का नहीं कह सकती... माफ़ कीजिएगा।",
            "... (अनन्या नीचे देखती है और धीरे से बोलती है) मैं सुन रही हूँ, धन्यवाद।"
        ],
        "Distracted student": [
            "अरे, माफ़ करना, आपने क्या कहा? मैं बाहर देख रहा था...",
            "ओह! उम, हाँ... क्या आप उसे दोहरा सकते हैं? मैं अपनी कॉपी में कुछ लिख रहा था...",
            "शिक्षक जी, लंच ब्रेक कब होगा? मुझे बहुत भूख लग रही है।"
        ],
        "Hyperactive student": [
            "सर! सर! मुझे पता है! यह वैसा ही है जैसे हम गेंद फेंकते हैं और वह नीचे गिरती है, है ना? मैंने यह किताब में पढ़ा था!",
            "मेरे पास एक विचार है! हम अभी एक प्रयोग कर सकते हैं! क्या हम कर सकते हैं, सर? प्लीज!",
            "इससे मुझे कल देखा हुआ एक वीडियो याद आया जहाँ उन्होंने एक तरबूज़ फोड़ दिया था! क्या हम भी ऐसा कर सकते हैं?"
        ],
        "Weak learner": [
            "सर/मैम, मैं थोड़ी उलझन में हूँ। क्या आप कृपया आखिरी हिस्सा एक आसान उदाहरण के साथ दोबारा समझा सकते हैं?",
            "मैं समझने की कोशिश कर रही हूँ, पर यह थोड़ा तेज़ हो रहा है। उस शब्द का क्या मतलब है?",
            "तो... इसका मतलब यह हुआ कि जब तापमान बढ़ता है, तब ऐसा होता है? या मैंने उल्टा समझ लिया?"
        ],
        "Overconfident student": [
            "यह तो बहुत आसान है! इसका जवाब ज़रूर 100 गुना होगा, क्योंकि इस स्थिति में सब कुछ बढ़ जाता है!",
            "मुझे यह सब पहले से पता है! यह तो बस सामान्य ज्ञान है, है ना? हमें इसे लिखने की भी ज़रूरत नहीं है।",
            "इसका सीधा जवाब है: यह चुंबकत्व की वजह से काम करता है। मैं सौ प्रतिशत आश्वस्त हूँ!"
        ]
    },
    "Bengali": {
        "Curious student": [
            "শিক্ষক মহাশয়, এটি অত্যন্ত চমৎকার! এই বিষয়টি কীভাবে প্রযোজ্য হবে যদি আমরা এর পরিস্থিতি পরিবর্তন করি? আপনি কি এর সম্পর্কটি বুঝিয়ে বলবেন?",
            "আমরা কি গত সপ্তাহে শেখা অন্য কোনো তত্ত্ব দিয়ে এটি ব্যাখ্যা করতে পারি? আমি সংযোগটি জানতে আগ্রহী।",
            "সেটা তো বুঝলাম, কিন্তু আমাদের দৈনন্দিন জীবনে এই ধারণার বাস্তব প্রয়োগ কী?"
        ],
        "Shy student": [
            "উম... হ্যাঁ, মনে হয় বুঝতে পেরেছি... (ধীরে ধীরে মাথা নাড়ে)",
            "আমার... আমার মনে হয় উত্তরটা এর সাথেই সম্পর্কিত, তবে আমি পুরোপুরি নিশ্চিত নই... দুঃখিত।",
            "... (অনন্যা নিচের দিকে তাকিয়ে মৃদুস্বরে বলে) আমি শুনছি, ধন্যবাদ।"
        ],
        "Distracted student": [
            "দুঃখিত শিক্ষক, আপনি কী বললেন? আমি জানলার বাইরে একটি পাখি দেখছিলাম...",
            "ওহ! উম, হ্যাঁ... ওটা কি আর একবার বলবেন? আমি খাতায় কিছু লিখছিলাম...",
            "শিক্ষক মহাশয়, টিফিনের সময় কখন হবে? আমার খুব খিদে পেয়েছে।"
        ],
        "Hyperactive student": [
            "স্যার! স্যার! আমি জানি! এটা ঠিক যখন আমরা একটা বল ছুড়ে দিই আর ওটা নিচে নেমে আসে মাধ্যাকর্ষণের জন্য, তাই না? আমি এটা একটা বইয়ে পড়েছি!",
            "আমার একটা দারুণ বুদ্ধি আছে! আমরা এখনই একটা বিজ্ঞান পরীক্ষা করতে পারি! পারি কি স্যার?",
            "এটা দেখে আমার গতকাল ইউটিউবে দেখা একটা ভিডিওর কথা মনে পড়ে গেল যেখানে একটা তরমুজ ফাটানো হয়েছিল! আমরা কি কিছু ফাটাতে পারি?"
        ],
        "Weak learner": [
            "স্যার/ম্যাডাম, আমি একটু বিভ্রান্ত হয়ে পড়েছি। আপনি কি দয়া করে শেষ অংশটি একটি সহজ উদাহরণ দিয়ে আর একবার বুঝিয়ে দেবেন?",
            "আমি বোঝার চেষ্টা করছি, কিন্তু একটু বেশি দ্রুত হয়ে যাচ্ছে। ওই নির্দিষ্ট শব্দটির মানে কী?",
            "তাহলে... এর মানে কি এই যে তাপমাত্রা বাড়লে এটা ঘটে? নাকি আমি উল্টো বুঝলাম?"
        ],
        "Overconfident student": [
            "এটা তো খুবই সহজ! এর উত্তর নিশ্চিতভাবেই ১০০ গুণ হবে, কারণ এই পরিস্থিতিতে সবকিছুই বহুগুণ বেড়ে যায়!",
            "আমি এগুলো সবই আগে থেকে জানি! এটা তো সাধারণ জ্ঞান, তাই না? আমাদের লেখারও প্রয়োজন নেই।",
            "এর ব্যাখ্যা সহজ: এটি চুম্বকত্বের কারণে কাজ করে। আমি ১০০ ভাগ নিশ্চিত যে এটাই ঠিক!"
        ]
    }
}


def clean_json_response(response_text: str) -> str:
    """
    Cleans markdown formatting from Gemini outputs (e.g. ```json ... ```).
    """
    cleaned = response_text.strip()
    # Remove markdown tags
    cleaned = re.sub(r"^```(?:json)?", "", cleaned)
    cleaned = re.sub(r"```$", "", cleaned)
    return cleaned.strip()


async def generate_student_reply(
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
    active_event: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates a student response. Calls Gemini API if available, else falls back to rule-based logic.
    """
    if HAS_API_KEY:
        try:
            # Structure conversation history for prompt context
            history_str = ""
            for msg in conversation_history[-6:]:
                history_str += f"{msg['sender_name']}: {msg['message_text']}\n"

            prompt = f"""
            You are an AI simulating a classroom student for B.Ed teacher training.
            
            CLASSROOM CONTEXT:
            - Subject: {subject}
            - Topic: {topic}
            - Grade Level: {class_level}
            - Lesson Objectives: {objectives}
            - Teaching Method: {method}
            - Language: {language} (You MUST respond in this language. If language is Hindi, speak Hindi. If Bengali, speak Bengali).

            STUDENT PROFILE:
            - Name: {student_name}
            - Personality: {student_personality}
            
            ACTIVE CLASSROOM EVENT (if any):
            - Event ID: {active_event if active_event else 'None'}
            
            CONVERSATION HISTORY (recent turns):
            {history_str}
            
            TEACHER'S LATEST INPUT:
            "{teacher_message}"

            Based on the student's personality, how they are affected by the active event, and what the teacher just said:
            Generate a realistic response.
            
            If the language is Hindi, you can write in Devnagari script. If Bengali, write in Bengali script.
            
            Choose a suitable visual emotion status for the student:
            - 'normal'
            - 'confused' (if Weak learner, or concept is tough)
            - 'questioning' (if Curious/Hyperactive/asking a question)
            - 'sleeping' (if Distracted/Shy and attention dropped)
            - 'distracted' (if looking away or talking to neighbors)

            Return ONLY a raw JSON object (no markdown wrapping, no ```json formatting, just raw JSON) with the following structure:
            {{
                "responding_student": "{student_name}",
                "response_text": "the student reply",
                "emotion": "one of the emotions above"
            }}
            """
            
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(prompt)
            cleaned_text = clean_json_response(response.text)
            return json.loads(cleaned_text)
            
        except Exception as e:
            print(f"Gemini API Error, falling back: {e}")
            # fall through to fallback

    # Fallback rule-based responder
    lang = language if language in FALLBACK_DIALOGUES else "English"
    dialogues = FALLBACK_DIALOGUES[lang].get(student_personality, FALLBACK_DIALOGUES[lang]["Weak learner"])
    response_text = random.choice(dialogues)

    # Determine emotion based on persona
    emotion = "normal"
    if student_personality == "Curious student":
        emotion = "questioning"
    elif student_personality == "Weak learner":
        emotion = "confused"
    elif student_personality == "Distracted student":
        emotion = "distracted"
    elif student_personality == "Shy student":
        emotion = "sleeping" if random.random() < 0.5 else "normal"

    return {
        "responding_student": student_name,
        "response_text": response_text,
        "emotion": emotion
    }


async def generate_evaluation(
    subject: str,
    topic: str,
    class_level: str,
    objectives: str,
    method: str,
    language: str,
    transcript: List[Dict[str, str]]
) -> Dict[str, Any]:
    """
    Evaluates the training session. Calls Gemini API if available, else computes mock analytics.
    """
    transcript_str = ""
    teacher_turns = 0
    words_count = 0
    addressed_students = set()
    
    for msg in transcript:
        transcript_str += f"{msg['sender_name']} ({msg['sender_type']}): {msg['message_text']}\n"
        if msg['sender_type'] == 'teacher':
            teacher_turns += 1
            words_count += len(msg['message_text'].split())
            # Check if any student names were mentioned in teacher speech
            for name in ["Aarav", "Ananya", "Vihaan", "Ishaan", "Riya", "Kabir"]:
                if name.lower() in msg['message_text'].lower():
                    addressed_students.add(name)

    if HAS_API_KEY:
        try:
            prompt = f"""
            You are a professional B.Ed Teacher Training Assessor evaluating a virtual classroom teaching session.
            
            SESSION CONFIGURATION:
            - Subject: {subject}
            - Topic: {topic}
            - Grade Level: {class_level}
            - Lesson Objectives: {objectives}
            - Teaching Method: {method}
            - Language: {language}

            SESSION TRANSCRIPT:
            {transcript_str}

            Please evaluate the trainee teacher's performance. Grade them out of 100 on the following metrics:
            1. Communication Score: Assess clarity of explanations, language appropriateness, tone, and pronunciation helpers.
            2. Engagement Score: How active were they in addressing different students? Did they call on shy students (Ananya), manage distracted students (Vihaan) and hyperactive interruptions (Ishaan)?
            3. Time Management Score: Did they cover the objectives, keep explanation brief versus student interaction, and respect session limits?
            4. Question Handling Score: Did they answer Aarav's deep queries? Were they patient and supportive with Riya (weak learner)? Did they constructively guide Kabir (overconfident student)?

            Return ONLY a raw JSON object (no markdown wrapping, no ```json formatting, just raw JSON) containing:
            {{
                "communication_score": integer (0 to 100),
                "engagement_score": integer (0 to 100),
                "time_management_score": integer (0 to 100),
                "question_handling_score": integer (0 to 100),
                "suggestions": "detailed markdown string outlining strengths and specific areas of improvements using B.Ed pedagogical terms",
                "transcript_summary": "a short 2-3 sentence summary of the session"
            }}
            """
            
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(prompt)
            cleaned_text = clean_json_response(response.text)
            return json.loads(cleaned_text)
            
        except Exception as e:
            print(f"Gemini API evaluation error: {e}")
            # fall through to fallback

    # Rule-based fallback evaluator
    # Simple heuristics to generate credible-looking scores
    comm_score = min(95, max(50, 70 + (words_count // 100) - abs(teacher_turns - 8)))
    
    # Engagement score increases based on number of distinct students addressed
    eng_score = min(98, max(45, 50 + (len(addressed_students) * 8)))
    
    # Time management scores
    time_score = min(95, max(40, 85 - abs(teacher_turns - 7) * 4))
    
    # Question handling score
    question_score = min(96, max(50, 65 + (5 if "Riya" in addressed_students else 0) + (5 if "Aarav" in addressed_students else 0) + (5 if "Kabir" in addressed_students else 0)))

    suggestions_list = [
        "**Strengths:** You demonstrated structured lesson structure and maintained focus on the core topic.",
        f"**Voice Modulation:** Your communication was clear with approximately {words_count} spoken words, which fits standard B.Ed micro-teaching ratios."
    ]

    if "Ananya" not in addressed_students:
        suggestions_list.append("- *Engagement Opportunity:* Try calling on quieter/shy students like Ananya specifically by name to draw them into discussions.")
    else:
        suggestions_list.append("- *Good Job:* You actively engaged Ananya, supporting inclusive learning.")

    if "Vihaan" not in addressed_students:
        suggestions_list.append("- *Classroom Management:* You missed addressing distracted behaviors (Vihaan). Keep scanning the virtual room to prompt off-task students.")
    else:
        suggestions_list.append("- *Good Job:* You addressed classroom distractions constructively and brought focus back to the lesson.")

    if "Riya" not in addressed_students:
        suggestions_list.append("- *Scaffolding:* Weak learners (Riya) could benefit from more repetition and slower pacing. Try explaining key points using analogies.")
    
    suggestions_text = "\n\n".join(suggestions_list) + "\n\n**Recommendation:** Practice dividing your lecture time between direct instruction (40%) and interactive questioning (60%) to maximize student participation."

    return {
        "communication_score": int(comm_score),
        "engagement_score": int(eng_score),
        "time_management_score": int(time_score),
        "question_handling_score": int(question_score),
        "suggestions": suggestions_text,
        "transcript_summary": f"A training session on {subject} ({topic}) targeting class level {class_level}. The teacher delivered explanation with {teacher_turns} conversational exchanges."
    }
