import os
import hashlib
import asyncio
import edge_tts
from typing import Dict, Any

# Resolve absolute paths relative to the backend directory
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(BACKEND_DIR, "audio_cache")
os.makedirs(CACHE_DIR, exist_ok=True)

# Map student names to their voice profiles
# Edge TTS voices: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support
# Using Indian English voices + pitch/rate adjustments to sound like school children
STUDENT_VOICE_MAP = {
    # Primary student names from simulation
    "aarav": {
        "voice": "en-IN-PrabhatNeural",       # Indian English male
        "rate": "+8%",                          # Slightly fast, enthusiastic
        "pitch": "+12Hz",                       # Higher pitch for young boy
        "personality": "curious"
    },
    "ananya": {
        "voice": "en-IN-NeerjaExpressiveNeural",  # Indian English female, expressive
        "rate": "-10%",                            # Slower, shy/hesitant
        "pitch": "+16Hz",                          # High pitch, young girl
        "personality": "shy"
    },
    "vihaan": {
        "voice": "en-IN-PrabhatNeural",        # Indian English male
        "rate": "-5%",                          # Slightly slow, lazy/distracted
        "pitch": "+8Hz",                        # Young boy pitch
        "personality": "distracted"
    },
    "ishaan": {
        "voice": "en-IN-PrabhatNeural",        # Indian English male
        "rate": "+18%",                         # Fast, hyperactive
        "pitch": "+20Hz",                       # Highest pitch, excited kid
        "personality": "hyperactive"
    },
    "riya": {
        "voice": "en-IN-NeerjaExpressiveNeural",  # Indian English female
        "rate": "-12%",                            # Slow, struggling
        "pitch": "+14Hz",                          # Young girl pitch
        "personality": "weak_learner"
    },
    "kabir": {
        "voice": "en-IN-PrabhatNeural",        # Indian English male
        "rate": "+10%",                         # Quick, confident
        "pitch": "+5Hz",                        # Medium-high, cocky boy
        "personality": "overconfident"
    },
}

# Hindi voice mappings (for Hindi language sessions)
HINDI_VOICES = {
    "male": "hi-IN-MadhurNeural",
    "female": "hi-IN-SwaraNeural",
}

# Bengali voice mappings (for Bengali language sessions)
BENGALI_VOICES = {
    "male": "bn-IN-BashkarNeural",
    "female": "bn-IN-TanishaaNeural",
}

# Gender map for language-specific voice selection
STUDENT_GENDER = {
    "aarav": "male",
    "ananya": "female",
    "vihaan": "male",
    "ishaan": "male",
    "riya": "female",
    "kabir": "male",
}


def _get_voice_config(student_name: str, language: str = "English") -> Dict[str, str]:
    """
    Returns the voice ID and prosody settings for a student.
    Selects language-appropriate voice while keeping personality-based rate/pitch.
    """
    name_key = student_name.lower().strip()
    config = STUDENT_VOICE_MAP.get(name_key, STUDENT_VOICE_MAP["aarav"])
    gender = STUDENT_GENDER.get(name_key, "male")

    # Override voice ID for non-English languages
    lang_lower = language.lower() if language else "english"
    if "hindi" in lang_lower:
        voice = HINDI_VOICES[gender]
    elif "bengali" in lang_lower or "bangla" in lang_lower:
        voice = BENGALI_VOICES[gender]
    else:
        voice = config["voice"]

    return {
        "voice": voice,
        "rate": config["rate"],
        "pitch": config["pitch"],
    }


def _detect_script(text: str) -> str:
    """
    Auto-detect the script of the text by checking Unicode character ranges.
    Returns 'hindi', 'bengali', or 'english'.
    """
    devanagari_count = 0
    bengali_count = 0
    latin_count = 0

    for ch in text:
        cp = ord(ch)
        if 0x0900 <= cp <= 0x097F:  # Devanagari block
            devanagari_count += 1
        elif 0x0980 <= cp <= 0x09FF:  # Bengali block
            bengali_count += 1
        elif (0x0041 <= cp <= 0x005A) or (0x0061 <= cp <= 0x007A):  # Latin A-Z/a-z
            latin_count += 1

    # If there's ANY non-Latin script, use that language
    # (English voices can't pronounce Hindi/Bengali at all, so even 1 character matters)
    if devanagari_count > 0 and devanagari_count >= bengali_count:
        return "hindi"
    elif bengali_count > 0 and bengali_count > devanagari_count:
        return "bengali"
    return "english"


async def _synthesize_edge_tts(text: str, voice: str, rate: str, pitch: str, output_path: str):
    """
    Runs Edge TTS synthesis asynchronously and saves to an MP3 file.
    """
    communicate = edge_tts.Communicate(
        text=text,
        voice=voice,
        rate=rate,
        pitch=pitch,
    )
    await communicate.save(output_path)


def generate_speech_audio(text: str, student_name: str, language: str = "English") -> str:
    """
    Main TTS synthesis function.
    Uses Microsoft Edge Neural TTS for natural, human-like voices.
    Checks cache first, then generates new audio.
    Returns the absolute path to the audio file.
    """
    clean_text = text.strip()
    if not clean_text:
        raise ValueError("Cannot synthesize speech for an empty text string.")

    # Auto-detect script from the actual text content as a safety net
    # This ensures Hindi/Bengali text ALWAYS uses the correct voice
    detected_script = _detect_script(clean_text)
    if detected_script == "hindi":
        language = "Hindi"
    elif detected_script == "bengali":
        language = "Bengali"

    # Get voice configuration for this student + language
    config = _get_voice_config(student_name, language)
    voice = config["voice"]
    rate = config["rate"]
    pitch = config["pitch"]

    # Generate cache key based on voice + prosody + text
    hash_payload = f"{voice}_{rate}_{pitch}_{clean_text}"
    text_hash = hashlib.md5(hash_payload.encode("utf-8")).hexdigest()
    output_filename = f"speech_{text_hash}.mp3"
    output_path = os.path.join(CACHE_DIR, output_filename)

    # Cache hit — return immediately
    if os.path.isfile(output_path) and os.path.getsize(output_path) > 0:
        return output_path

    # Cache miss — synthesize with Edge TTS
    try:
        print(f"[Edge TTS] Synthesizing for {student_name} ({voice}, rate={rate}, pitch={pitch}) -> '{clean_text[:50]}...'")

        # Run async Edge TTS in a sync context
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop and loop.is_running():
            # We're inside an existing event loop (e.g., FastAPI) — run in a new thread
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(
                    asyncio.run,
                    _synthesize_edge_tts(clean_text, voice, rate, pitch, output_path)
                )
                future.result(timeout=30)
        else:
            # No event loop running — just use asyncio.run
            asyncio.run(_synthesize_edge_tts(clean_text, voice, rate, pitch, output_path))

        # Verify output and force disk synchronization
        if os.path.isfile(output_path) and os.path.getsize(output_path) > 0:
            try:
                # Force the OS write buffer to flush to physical storage
                with open(output_path, "a+b") as f:
                    f.flush()
                    os.fsync(f.fileno())
            except Exception as sync_err:
                print(f"[Edge TTS] Sync warning (non-fatal): {sync_err}")
                
            print(f"[Edge TTS] Successfully generated and synced: {output_filename}")
            return output_path
        else:
            raise FileNotFoundError(f"Generated audio file not found at {output_path}")

    except Exception as e:
        print(f"[Edge TTS Error] Synthesis failed: {e}")
        # Clean up corrupt files
        if os.path.exists(output_path):
            os.remove(output_path)
        raise e
