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


def build_topic_aware_response(
    student_name: str,
    personality: str,
    subject: str,
    topic: str,
    class_level: str,
    language: str,
    teacher_message: str
) -> str:
    """
    Generates highly accurate, topic-informed student responses for fallback mode.
    Injects subject-matter keywords aligned with selected Grade Level intelligence.
    """
    t_clean = topic.strip()
    s_clean = subject.strip()
    
    # Grade-adjusted keyword and concept injection to reflect student academic intelligence
    grade_lower = class_level.lower()
    sub_lower = s_clean.lower()
    keyword = ""
    
    if "primary" in grade_lower or "1-5" in grade_lower:
        # Extremely simple, concrete visual keywords for young kids (Grades 1-5)
        if "math" in sub_lower:
            keyword = random.choice(["counting", "shapes", "adding numbers", "sharing blocks"])
        elif "science" in sub_lower:
            keyword = random.choice(["plants", "bugs", "water", "sunlight", "sky", "animals"])
        elif "history" in sub_lower or "social" in sub_lower:
            keyword = random.choice(["kings", "old stories", "old maps", "family trees"])
        else:
            keyword = random.choice(["easy words", "pictures", "stories"])
    elif "middle" in grade_lower or "6-8" in grade_lower:
        # Moderate complexity for pre-teens (Grades 6-8)
        if "math" in sub_lower:
            keyword = random.choice(["fractions", "simple equations", "decimals", "ratios"])
        elif "science" in sub_lower:
            keyword = random.choice(["cells", "gravity", "energy", "basic experiments", "ecosystems"])
        elif "history" in sub_lower or "social" in sub_lower:
            keyword = random.choice(["timelines", "civilizations", "empires", "centuries"])
        else:
            keyword = random.choice(["grammar rules", "vocabulary list", "sentence structures"])
    else:
        # High School - Advanced technical/academic terms (Grades 9-12)
        if "math" in sub_lower:
            keyword = random.choice(["algebraic variables", "coordinate scaling", "functions", "formulas"])
        elif "science" in sub_lower:
            keyword = random.choice(["chemical reactions", "molecular bonds", "gravitational force", "cellular mitosis"])
        elif "history" in sub_lower or "social" in sub_lower:
            keyword = random.choice(["geopolitical borders", "socio-economic impacts", "constitutional laws", "historical analysis"])
        else:
            keyword = random.choice(["literary devices", "syntactical structures", "drama plots", "rhyme schemes"])

    # Template mappings
    if language == "Hindi":
        if personality == "Curious student":
            templates = [
                f"शिक्षक, मैं {t_clean} के बारे में और पढ़ रहा था। यह {s_clean} के बाकी सिद्धांतों और {keyword} से कैसे संबंधित है?",
                f"{t_clean} की यह अवधारणा वास्तव में बहुत दिलचस्प है! यदि हम इसमें {keyword} की परिस्थितियों को बदल दें तो क्या होगा?",
                f"क्या हम {t_clean} के वास्तविक जीवन के उदाहरणों पर चर्चा कर सकते हैं? यह हमारे दैनिक जीवन को कैसे प्रभावित करता है?"
            ]
        elif personality == "Shy student":
            templates = [
                f"उम... जी सर, मुझे लगता है कि मैं {t_clean} समझ रही हूँ... (धीरे से सिर हिलाती है)",
                f"मुझे लगता है कि {t_clean} का उत्तर {keyword} से जुड़ा होना चाहिए, पर मैं पूरी तरह सुनिश्चित नहीं हूँ... माफ़ कीजिएगा।",
                f"... (अनन्या शांत है) जी, मैं सुन रही हूँ और {t_clean} के बारे में नोट्स लिख रही हूँ।"
            ]
        elif personality == "Distracted student":
            templates = [
                f"ओह! माफ़ करना शिक्षक जी, आपने {t_clean} के बारे में क्या कहा? मैं बाहर एक सुंदर पक्षी देख रहा था...",
                f"क्या आप {t_clean} वाला आखिरी हिस्सा दोहरा सकते हैं? मैं कॉपी में {keyword} के बारे में कुछ और लिख रहा था...",
                f"शिक्षक जी, क्या {t_clean} का संबंध हमारे वीडियो गेम्स से भी है? वैसे, लंच ब्रेक कब होगा?"
            ]
        elif personality == "Hyperactive student":
            templates = [
                f"सर! सर! {t_clean} तो बहुत मजेदार है! क्या हम {keyword} का उपयोग करके इसपर अभी एक लाइव प्रयोग कर सकते हैं? प्लीज!",
                f"ओह, मुझे पता है! {t_clean} ठीक वैसा ही है जैसे जब हम किसी चीज़ को ऊपर फेंकते हैं और वह नीचे आती है, है ना?",
                f"यह तो बहुत आसान है! मुझे {t_clean} पर कल देखा हुआ एक यूट्यूब वीडियो याद आ गया। क्या मैं इसके बारे में बताऊं?"
            ]
        elif personality == "Weak learner":
            templates = [
                f"सर/मैम, मैं {t_clean} को लेकर थोड़ी उलझन में हूँ। क्या आप कृपया {keyword} के एक बहुत ही सरल उदाहरण के साथ समझा सकते हैं?",
                f"मैं {t_clean} को समझने की कोशिश कर रही हूँ, पर यह थोड़ा कठिन लग रहा है। {keyword} का मुख्य अर्थ क्या है?",
                f"तो... क्या {t_clean} का मतलब यह हुआ कि जब तापमान बढ़ता है तो दबाव भी बढ़ता है? या मैंने उल्टा समझ लिया?"
            ]
        else: # Overconfident student
            templates = [
                f"अरे, {t_clean} तो बहुत आसान है! यह तो {s_clean} और {keyword} का मूल ज्ञान है। हमें इसे ज़्यादा रटने की ज़रूरत नहीं है!",
                f"मुझे {t_clean} का उत्तर पता है! यह सब चुंबकत्व और गुरुत्वाकर्षण के कारण होता है। मैं शत-प्रतिशत आश्वस्त हूँ!",
                f"इसका सीधा जवाब है कि {t_clean} बस एक प्राकृतिक नियम है और मैं इसके बारे में पहले से सब जानता हूँ!"
            ]
    elif language == "Bengali":
        if personality == "Curious student":
            templates = [
                f"শিক্ষক মহাশয়, আমি {t_clean} সম্পর্কে পড়ছিলাম। এটি {s_clean}-এর অন্যান্য বিষয়ের সাথে কীভাবে সম্পর্কিত? আমরা কি {keyword} নিয়ে আরও আলোচনা করতে পারি?",
                f"{t_clean}-এর এই ধারণাটি অত্যন্ত চমৎকার! যদি আমরা এর {keyword} পরিস্থিতি পরিবর্তন করি তবে কী প্রভাব পড়বে?",
                f"আমাদের দৈনন্দিন জীবনে {t_clean}-এর বাস্তব প্রয়োগ কী? এটি আমরা কীভাবে কাজে লাগাতে পারি?"
            ]
        elif personality == "Shy student":
            templates = [
                f"উম... হ্যাঁ স্যার, মনে হয় {t_clean} বুঝতে পারছি... (ধীরে ধীরে মাথা নাড়ে)",
                f"আমার মনে হয় {t_clean}-এর উত্তরটা {keyword}-এর সাথে সম্পর্কিত হবে, তবে আমি পুরোপুরি নিশ্চিত নই... দুঃখিত।",
                f"... (অনন্যা শান্ত আছে) হ্যাঁ স্যার, আমি শুনছি এবং {t_clean} নিয়ে খাতায় লিখছি।"
            ]
        elif personality == "Distracted student":
            templates = [
                f"ওহ! দুঃখিত স্যার, আপনি {t_clean} সম্পর্কে কী বলছিলেন? আমি জানলার বাইরে একটি পাখি দেখছিলাম...",
                f"আপনি কি {t_clean}-এর শেষ অংশটি আর একবার বলবেন? আমি খাতায় {keyword} নিয়ে অন্য কিছু লিখছিলাম...",
                f"শিক্ষক মহাশয়, {t_clean} কি কোনোভাবে আমাদের গেমসের সাথে যুক্ত? আমাদের টিফিন কখন হবে?"
            ]
        elif personality == "Hyperactive student":
            templates = [
                f"স্যার! স্যার! {t_clean} তো দারুণ মজার! আমরা কি এখনই {keyword} নিয়ে কোনো পরীক্ষা করতে পারি? প্লিজ স্যার!",
                f"আমি জানি! {t_clean} ঠিক যেমন একটা বল ছুড়ে দিলে মাধ্যাকর্ষণের জন্য নিচে নেমে আসে, তাই না?",
                f"ওটা তো খুবই সহজ! আমার গতকাল দেখা একটি ভিডিওর কথা মনে পড়ে গেল! আমি কি ওটা শেয়ার করতে পারি?"
            ]
        elif personality == "Weak learner":
            templates = [
                f"স্যার/ম্যাডাম, আমি {t_clean} নিয়ে একটু বিভ্রান্ত হয়ে পড়েছি। আপনি কি দয়া করে {keyword}-এর একটি সহজ উদাহরণ দিয়ে বুঝিয়ে দেবেন?",
                f"আমি {t_clean} বোঝার চেষ্টা করছি, কিন্তু একটু বেশি দ্রুত হয়ে যাচ্ছে। ওই {keyword} বিষয়টার মূল মানে কী?",
                f"তাহলে... {t_clean}-এর মানে কি এই যে তাপমাত্রা বাড়লে এটা ঘটে? নাকি আমি ভুল বুঝলাম?"
            ]
        else: # Overconfident student
            templates = [
                f"আরে, {t_clean} তো খুবই সহজ! এটি তো {s_clean}-এর সাধারণ {keyword} বিষয়, তাই না? আমাদের এটি বেশি পড়ার প্রয়োজন নেই!",
                f"আমি {t_clean}-এর উত্তর ১০০ ভাগ নিশ্চিত জানি! এটি চুম্বকত্ব আর {keyword}-এর জন্য ঘটে থাকে স্যার!",
                f"এর ব্যাখ্যা তো খুবই সহজ এবং আমি {t_clean} সম্পর্কে আগে থেকেই সব জানি, আমাদের সময় নষ্ট না করলেও চলবে!"
            ]
    else: # English (Default)
        if personality == "Curious student":
            templates = [
                f"Teacher, I was reading about {t_clean} in {s_clean}. How does this concept apply if we change the scale or {keyword}? Can you explain the correlation?",
                f"This concept of {t_clean} is fascinating! Can we relate this phenomenon to other {keyword} we learned recently?",
                f"That makes sense, but what is the practical, real-world application of {t_clean} in our daily lives?"
            ]
        elif personality == "Shy student":
            templates = [
                f"Umm... yes, I think I understand {t_clean}... (nods quietly)",
                f"I... I think the answer for {t_clean} might be related to {keyword}, but I'm not entirely sure... sorry.",
                f"... (Ananya looks down and speaks softly) I am listening and taking notes on {t_clean}, thank you."
            ]
        elif personality == "Distracted student":
            templates = [
                f"Wait, sorry teacher, what did you say about {t_clean}? I was looking at a bird outside...",
                f"Oh! Um, yes... could you repeat that part about {t_clean}? I was just writing down something about {keyword} in my notebook...",
                f"Teacher, how does {t_clean} relate to the video games we play? Also, when is lunch break?"
            ]
        elif personality == "Hyperactive student":
            templates = [
                f"Ooh! Ooh! Pick me! I know! {t_clean} is just like when you throw a ball and it comes down because of gravity, right?",
                f"I have a great idea! Can we do a live science experiment on {t_clean} right now using {keyword}? Can we, teacher? Please!",
                f"This reminds me of a cool YouTube video I saw yesterday about {t_clean}! Can we blow things up?"
            ]
        elif personality == "Weak learner":
            templates = [
                f"Sir/Ma'am, I am a bit confused about {t_clean}. Could you please explain {keyword} again with a simple example?",
                f"I'm trying to follow {t_clean}, but it's going a bit too fast for me. What does that specific term in {keyword} mean?",
                f"So... does it mean that in {t_clean}, when one variable increases, this happens? Or did I get it backwards?"
            ]
        else: # Overconfident student
            templates = [
                f"That's easy! The answer for {t_clean} is obviously 100 times that, because everything multiplies under these {keyword} conditions!",
                f"I already know all about {t_clean}! It's basically just common sense in {s_clean}, right? We don't even need to write it down.",
                f"The explanation for {t_clean} is simple: it works because of magnetism and {keyword}. I'm 100% sure that's correct!"
            ]
    base_reply = random.choice(templates)
    
    # If primary grade level (Grades 1-5), simplify complex/academic vocabulary words for young kids
    if "primary" in grade_lower or "1-5" in grade_lower:
        if language == "Hindi":
            base_reply = base_reply.replace("महत्वपूर्ण", "ज़रूरी").replace("अवधारणा", "बात").replace("सिद्धांतों", "बातों").replace("सिद्धांत", "बात")
        elif language == "Bengali":
            base_reply = base_reply.replace("তত্ত্ব", "সহজ কথা").replace("ধারণাটি", "বিষয়টি").replace("প্রয়োগ", "ব্যবহার").replace("তত্ত্বটি", "সহজ কথা")
        else: # English simplifications
            base_reply = base_reply.replace("fascinating", "cool").replace("phenomenon", "thing").replace("correlation", "connection").replace("application", "use").replace("context", "lesson").replace("factors", "things")
            
    return base_reply


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
    Generates a student response. Calls Gemini API if available, else falls back to dynamic rule-based logic.
    """
    # Clean up the teacher message to check for simple greetings
    t_msg_clean = teacher_message.lower().strip("?!., ")
    
    # Common classroom greetings
    greetings = [
        "good morning", "good afternoon", "good evening", "hello", "hi", "hey",
        "suprabhat", "namaste", "namaskar", "pranam", "shubho shokal", "suprabhath",
        "shuvo sokal", "how are you", "kemon acho", "aap kaise hain"
    ]
    
    # Check if teacher message is primarily a short greeting
    is_greeting = False
    for g in greetings:
        if g in t_msg_clean and len(t_msg_clean) < len(g) + 12:
            is_greeting = True
            break
            
    if is_greeting:
        # Personalized student greeting replies based on language and persona
        t_clean = topic.strip()
        
        if language == "Hindi":
            if student_name == "Aarav":
                reply_text = f"सुप्रभात शिक्षक! मैं आज के विषय {t_clean} के बारे में पढ़ रहा था, यह बहुत दिलचस्प लग रहा है!"
            elif student_name == "Ananya":
                reply_text = "नमस्ते सर/मैम... (धीरे से सिर झुकाती है)"
            elif student_name == "Vihaan":
                reply_text = "ओह! सुप्रभात शिक्षक जी! (जल्दी से अपनी डेस्क साफ करता है और पेंसिल उठाता है)"
            elif student_name == "Ishaan":
                reply_text = f"नमस्ते शिक्षक जी! सुप्रभात! आज हम {t_clean} में क्या नया प्रयोग करने वाले हैं? मुझे बहुत उत्सुकता है!"
            elif student_name == "Riya":
                reply_text = f"सुप्रभात सर/मैम! कृपया आज थोड़ा धीरे पढ़ाइएगा, {t_clean} मुझे थोड़ा कठिन लगता है।"
            else: # Kabir
                reply_text = f"सुप्रभात शिक्षक जी! मैंने {t_clean} को कल रात ही पूरा पढ़ लिया था, आप कोई भी सवाल पूछ सकते हैं!"
            emotion = "normal" if student_name != "Ishaan" else "questioning"
            
        elif language == "Bengali":
            if student_name == "Aarav":
                reply_text = f"শুভ সকাল শিক্ষক মহাশয়! আমি আজকের বিষয় {t_clean} নিয়ে পড়ছিলাম, এটি খুব আকর্ষণীয় মনে হচ্ছে!"
            elif student_name == "Ananya":
                reply_text = "নমস্কার স্যার... (ধীরে ধীরে মাথা নিচু করে)"
            elif student_name == "Vihaan":
                reply_text = "ওহ! শুভ সকাল স্যার! (তাড়াতাড়ি নিজের খাতা বন্ধ করে সোজা হয়ে বসে)"
            elif student_name == "Ishaan":
                reply_text = f"শুভ সকাল স্যার! নমস্কার! আজ আমরা {t_clean} নিয়ে কী নতুন খেলা বা পরীক্ষা করব স্যার? আমি খুব এক্সাইটেড!"
            elif student_name == "Riya":
                reply_text = f"শুভ সকাল স্যার/ম্যাডাম! আশা করি আজকের ক্লাসটা খুব কঠিন হবে না, {t_clean} আমার একটু কঠিন লাগে।"
            else: # Kabir
                reply_text = f"শুভ সকাল স্যার! আমি {t_clean} চ্যাপ্টারটা গতকাল রাতেই পুরো মুখস্থ করে নিয়েছি, আপনি যেকোনো প্রশ্ন করতে পারেন!"
            emotion = "normal" if student_name != "Ishaan" else "questioning"
            
        else: # English / default
            if student_name == "Aarav":
                reply_text = f"Good morning, teacher! I was looking at our topic, {t_clean}, and it seems really interesting. Can't wait to start!"
            elif student_name == "Ananya":
                reply_text = "Good morning, teacher... (nods softly)"
            elif student_name == "Vihaan":
                reply_text = "Oh, good morning, teacher! (scrambles to close his sketchpad)"
            elif student_name == "Ishaan":
                reply_text = f"Good morning, teacher! I'm super excited! What are we going to build or draw first today for {t_clean}?!"
            elif student_name == "Riya":
                reply_text = f"Good morning, teacher! I hope we can go a little slow today, I'm a bit nervous about {t_clean}."
            else: # Kabir
                reply_text = f"Good morning, teacher! I've already mastered today's lesson on {t_clean}, but I'm ready to show you!"
            emotion = "normal" if student_name != "Ishaan" else "questioning"
            
        return {
            "responding_student": student_name,
            "response_text": reply_text,
            "emotion": emotion
        }

    if HAS_API_KEY:
        try:
            # Structure conversation history for prompt context
            history_str = ""
            for msg in conversation_history[-6:]:
                history_str += f"{msg['sender_name']}: {msg['message_text']}\n"

            prompt = f"""
            You are simulating a classroom student for teacher training.
            
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

            INSTRUCTIONS:
            1. Generate a realistic student response.
            2. Be highly concise: keep responses short and natural (1-3 sentences maximum).
            3. Act strictly according to the student's specific character, personality, and active Grade Level ({class_level}):
               - Aarav (Curious student): Engaged, inquisitive, asks deep, thoughtful questions connecting {topic} to other things. Sounds genuinely excited to learn.
               - Ananya (Shy student): Extremely quiet, soft-spoken, and anxious. Speaks briefly, using hesitant pauses ("Umm...", "Uh...", "...sorry"), nods quietly, or mentions that she was taking notes. Never blurts out answers or raises her voice.
               - Vihaan (Distracted student): Off-task, daydreaming, or looking out the window. Talks about unrelated things like toys, video games, lunch time, or a bird outside. Often asks the teacher to repeat the question because he wasn't listening.
               - Ishaan (Hyperactive student): Bursting with energy, hyperactive, speaks out of turn. Uses exclamation marks, childish excitement, blurts out random facts, suggests making live explosions/experiments, or tells fast, unrelated personal stories.
               - Riya (Weak learner): Struggles to grasp complex concepts, has low academic confidence. Easily confused by big academic words. Asks for simple, concrete real-world examples or analogies (e.g. sharing blocks, apples, water), and frequently gets things mixed up or asks the teacher to slow down.
               - Kabir (Overconfident student): Bold, cocky, and boastful. Claims everything is "super easy", "common sense", or that he already knows it all. Frequently blurts out answers with absolute 100% certainty, though his answers are often oversimplified, slightly inaccurate, or missing the point.
            4. GRADE LEVEL INTELLIGENCE GUIDELINES (Crucial):
               - Primary (Grades 1-5): Act like young children (6-10 years old). Use extremely simple, colloquial words, very short sentences, and concrete visual analogies (like fruits, toys, shapes, skies, birds). They do NOT know complex formulas, variables, high-level academic jargon, or advanced vocabulary. If the teacher uses big or advanced academic words (e.g. "photosynthesis", "mechanisms", "principles", "phenomenon", "coefficient"), the student MUST act confused by the "big words" (e.g. "Teacher, what does that big word mean?", "I don't understand that big word, can you use a story?").
               - Middle School (Grades 6-8): Act like young teenagers (11-14 years old). Have basic academic knowledge (know simple equations, basic biology/history facts, decimals), but get confused by highly advanced technical details or university-level jargon. Use moderate, typical middle-school vocabulary.
               - High School (Grades 9-12): Act like mature teenagers (15-18 years old). Use sophisticated academic terms, formulate logical arguments, and get overconfident with actual formulas, technical parameters, and college prep mindset.
            5. If the teacher asked a direct question, make the student answer according to their academic level.
            6. Respond in the exact language script requested (Devanagari for Hindi, Bengali script for Bengali, English letters for English).

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

    # Dynamic fallback responder incorporating subject, topic, and persona parameters
    response_text = build_topic_aware_response(
        student_name=student_name,
        personality=student_personality,
        subject=subject,
        topic=topic,
        class_level=class_level,
        language=language,
        teacher_message=teacher_message
    )

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

    # If the session is extremely short (e.g. under 3 teacher turns), it is likely just an introductory greeting or quick test.
    # We return encouraging high scores and a supportive introduction message instead of penalizing them.
    if teacher_turns < 3:
        return {
            "communication_score": 90,
            "engagement_score": 90,
            "time_management_score": 90,
            "question_handling_score": 90,
            "suggestions": (
                "### Great Start!\n"
                "This was a quick introductory greeting. You welcomed the class warmly, which is an excellent pedagogical habit! "
                "To receive a detailed, in-depth B.Ed pedagogical appraisal, please continue the lesson by introducing your topic, explaining key concepts, and interacting with different students (Aarav, Ananya, Vihaan, Ishaan, Riya, Kabir) for a few more turns."
            ),
            "transcript_summary": f"Introductory welcome for {subject} class on {topic}. The teacher established a warm, positive rapport with the students."
        }

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
            1. Communication & Grade Appropriateness Score: Assess clarity of explanations, tone, and language suitability for the active Grade Level ({class_level}). CRITICAL: If the Grade Level is "Primary (Grades 1-5)", did the teacher explain concepts using extremely simple, concrete analogies, and avoid high-level jargon? Deduct significant points if they used overly complex terms or university-level jargon for young kids, and detail this in the suggestions.
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

    # If the session is extremely short (e.g. under 3 teacher turns), it is likely just an introductory greeting or quick test.
    # We should return welcoming, encouraging high scores and a supportive introduction message instead of penalizing them.
    if teacher_turns < 3:
        comm_score = 90
        eng_score = 90
        time_score = 90
        question_score = 90
        suggestions_text = (
            "### Great Start!\n"
            "This was a quick introductory greeting. You welcomed the class warmly, which is an excellent pedagogical habit! "
            "To receive a detailed B.Ed pedagogical appraisal, please continue the lesson by introducing the topic, explaining key concepts, and interacting with different students (Aarav, Ananya, Vihaan, Ishaan, Riya, Kabir) for a few more turns."
        )
        return {
            "communication_score": int(comm_score),
            "engagement_score": int(eng_score),
            "time_management_score": int(time_score),
            "question_handling_score": int(question_score),
            "suggestions": suggestions_text,
            "transcript_summary": f"Introductory welcome for {subject} class on {topic}. The teacher established a warm, positive rapport with the students."
        }

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
