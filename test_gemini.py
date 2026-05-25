import os
import google.generativeai as genai

api_key = os.environ.get("GEMINI_API_KEY", "AIzaSyArAST1rdY6rxoU63luytFbiVCsbPGrhWQ")
genai.configure(api_key=api_key)

try:
    print("Testing gemini-2.5-flash...")
    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content("Say Hello in exactly three words!")
    print("SUCCESS: Connection successful!")
    print("API Response:", response.text.strip())
except Exception as e:
    print("ERROR:", e)
