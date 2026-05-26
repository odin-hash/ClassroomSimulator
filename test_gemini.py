import os

def test_gemini_connection():
    """Quick test to verify Gemini API connectivity."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY environment variable not set.")
        print("Run: export GEMINI_API_KEY='your_key_here'")
        return

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        print("Testing gemini-2.0-flash...")
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents="Say Hello in exactly three words!"
        )
        print("SUCCESS: Connection successful!")
        print("API Response:", response.text.strip())
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_gemini_connection()
