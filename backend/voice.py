import os
import sys
import platform
import hashlib
import subprocess
import tarfile
import urllib.request
import urllib.parse
from typing import Dict, Any

# Resolve absolute paths relative to the backend directory to ensure compatibility with different working directories
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
BIN_DIR = os.path.join(BACKEND_DIR, "bin")
MODELS_DIR = os.path.join(BACKEND_DIR, "models")
CACHE_DIR = os.path.join(BACKEND_DIR, "audio_cache")

# Ensure all workspace cache/bin/model directories exist
os.makedirs(BIN_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(CACHE_DIR, exist_ok=True)

# 1. Map students to voice models and custom configurations
# Supports both original and newly requested names for dual-compatibility
STUDENT_VOICE_MAP = {
    # Original simulation names
    "aarav": "arjun",
    "ananya": "priya",
    "vihaan": "rahul",
    "riya": "neha",
    "ishaan": "kabir",
    "kabir": "riya_oc",
    # Requested task names
    "arjun": "arjun",
    "priya": "priya",
    "rahul": "rahul",
    "neha": "neha",
    "kabir_hyper": "kabir",
    "riya_oc": "riya_oc"
}

# Neural models metadata on Hugging Face (rhasspy/piper-voices v1.0.0)
VOICE_MODELS = {
    "arjun": { # Curious, energetic, medium speed, enthusiastic
        "model_name": "en_US-joe-medium",
        "relative_url": "en/en_US/joe/medium/en_US-joe-medium",
        "speed": 1.0,
        "pitch": 1.0
    },
    "priya": { # Shy, soft, slower, low confidence
        "model_name": "en_US-amy-medium",
        "relative_url": "en/en_US/amy/medium/en_US-amy-medium",
        "speed": 0.85, # soft and slower speaking
        "pitch": 1.05
    },
    "rahul": { # Distracted, casual, slightly lazy tone
        "model_name": "en_US-ryan-medium",
        "relative_url": "en/en_US/ryan/medium/en_US-ryan-medium",
        "speed": 0.92, # slightly casual/lazy
        "pitch": 0.95
    },
    "neha": { # Weak learner, slower, hesitant
        "model_name": "en_US-kristin-medium",
        "relative_url": "en/en_US/kristin/medium/en_US-kristin-medium",
        "speed": 0.82, # slower, hesitant speech
        "pitch": 1.0
    },
    "kabir": { # Hyperactive, fast speaking, excited
        "model_name": "en_US-arctic-medium",
        "relative_url": "en/en_US/arctic/medium/en_US-arctic-medium",
        "speed": 1.08, # fast and enthusiastic
        "pitch": 1.15  # higher-pitched excited tone
    },
    "riya_oc": { # Overconfident, confident, speaks quickly
        "model_name": "en_US-kelsey-medium",
        "relative_url": "en/en_US/kelsey/medium/en_US-kelsey-medium",
        "speed": 1.04, # confident and quick speaking
        "pitch": 1.0
    }
}


def get_piper_binary_path() -> str:
    """
    Returns the absolute path of the local precompiled piper binary.
    Automatically detects macOS vs Linux and downloads/extracts the correct release if missing.
    """
    system = platform.system().lower()
    machine = platform.machine().lower()
    
    # Detect CPU architecture (ARM64/Aarch64 vs Intel/AMD64)
    is_arm = "arm" in machine or "aarch" in machine
    
    # Dynamically select correct precompiled archive for the platform
    if "darwin" in system:
        archive_name = "piper_macos_aarch64.tar.gz" if is_arm else "piper_macos_x86_64.tar.gz"
    else:
        # Default to Linux binary (standard cloud hosting architecture)
        archive_name = "piper_linux_aarch64.tar.gz" if is_arm else "piper_linux_x86_64.tar.gz"
        
    download_url = f"https://github.com/rhasspy/piper/releases/download/v1.2.0/{archive_name}"
    
    piper_bin_dir = os.path.join(BIN_DIR, "piper")
    piper_executable = os.path.join(piper_bin_dir, "piper")
    
    # If the local executable already exists, return it immediately
    if os.path.isfile(piper_executable):
        return piper_executable

    print(f"[Piper Engine Setup] Local binary not found. Initiating auto-installer...")
    print(f"[Piper Engine Setup] System: {system}, CPU: {machine} (ARM: {is_arm})")
    print(f"[Piper Engine Setup] Downloading precompiled release from: {download_url}")
    
    tarball_path = os.path.join(BIN_DIR, archive_name)
    
    try:
        # Download the precompiled Piper tarball
        urllib.request.urlretrieve(download_url, tarball_path)
        print(f"[Piper Engine Setup] Download complete! Extracting archive to {piper_bin_dir}...")
        
        # Extract the tar.gz archive
        with tarfile.open(tarball_path, "r:gz") as tar:
            tar.extractall(path=BIN_DIR)
            
        # Clean up the downloaded tarball
        if os.path.exists(tarball_path):
            os.remove(tarball_path)
            
        # Ensure executable permissions are granted on the binary (critical for macOS/Unix)
        if os.path.isfile(piper_executable):
            os.chmod(piper_executable, 0o755)
            print("[Piper Engine Setup] Piper CLI engine successfully installed!")
            return piper_executable
        else:
            raise FileNotFoundError(f"Piper binary not found at {piper_executable} after extraction.")
            
    except Exception as e:
        print(f"[Piper Engine Error] Failed to download or configure local Piper engine: {e}")
        raise RuntimeError(f"Piper installer failed: {e}")


def get_voice_model_paths(voice_key: str) -> tuple:
    """
    Returns (onnx_path, json_path) for the given voice model.
    Downloads them dynamically from Hugging Face if they are not already cached.
    """
    voice_config = VOICE_MODELS.get(voice_key)
    if not voice_config:
        raise ValueError(f"Unknown voice identity key: {voice_key}")
        
    model_name = voice_config["model_name"]
    relative_url = voice_config["relative_url"]
    
    onnx_filename = f"{model_name}.onnx"
    json_filename = f"{model_name}.onnx.json"
    
    onnx_path = os.path.join(MODELS_DIR, onnx_filename)
    json_path = os.path.join(MODELS_DIR, json_filename)
    
    # Download ONNX model file if missing from cache
    if not os.path.isfile(onnx_path):
        hf_onnx_url = f"https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/{relative_url}.onnx?download=true"
        print(f"[Voice Model Setup] Downloading neural voice ONNX model for '{voice_key}': {onnx_filename}...")
        try:
            urllib.request.urlretrieve(hf_onnx_url, onnx_path)
            print(f"[Voice Model Setup] Model {onnx_filename} downloaded successfully.")
        except Exception as e:
            if os.path.exists(onnx_path):
                os.remove(onnx_path)
            raise RuntimeError(f"Failed to download voice ONNX file: {e}")
            
    # Download JSON configuration file if missing from cache
    if not os.path.isfile(json_path):
        hf_json_url = f"https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/{relative_url}.onnx.json?download=true"
        print(f"[Voice Model Setup] Downloading model settings configuration for '{voice_key}': {json_filename}...")
        try:
            urllib.request.urlretrieve(hf_json_url, json_path)
            print(f"[Voice Model Setup] Config {json_filename} downloaded successfully.")
        except Exception as e:
            if os.path.exists(json_path):
                os.remove(json_path)
            raise RuntimeError(f"Failed to download voice JSON file: {e}")
            
    return onnx_path, json_path


def generate_speech_audio(text: str, student_name: str) -> str:
    """
    Main neural TTS speech synthesis.
    Checks cache first, downloads binaries/models if missing, runs local Piper, and returns absolute path to .wav.
    """
    clean_text = text.strip()
    if not clean_text:
        raise ValueError("Cannot synthesize speech for an empty text string.")
        
    # Map the student name (case-insensitive) to their voice model profile
    name_key = student_name.lower().strip()
    voice_key = STUDENT_VOICE_MAP.get(name_key, "arjun") # Default to Arjun (Aarav/Curious) if unmapped
    
    voice_config = VOICE_MODELS[voice_key]
    model_name = voice_config["model_name"]
    speed = voice_config["speed"]
    
    # Generate unique MD5 hash based on voice model and spoken text to create a high-performance disk caching layer
    hash_payload = f"{model_name}_{speed}_{clean_text}"
    text_hash = hashlib.md5(hash_payload.encode("utf-8")).hexdigest()
    output_filename = f"speech_{text_hash}.wav"
    output_path = os.path.join(CACHE_DIR, output_filename)
    
    # 1. Disk-Cache Hit: Serve the generated audio immediately!
    if os.path.isfile(output_path) and os.path.getsize(output_path) > 0:
        return output_path
        
    # 2. Disk-Cache Miss: Proceed with generation
    try:
        # Resolve path to local piper binary (downloads on-demand)
        piper_bin = get_piper_binary_path()
        
        # Resolve path to student neural voice models (downloads on-demand)
        onnx_model, _ = get_voice_model_paths(voice_key)
        
        print(f"[Piper Neural Synthesis] Synthesizing speech for {student_name} ({voice_key}) -> '{clean_text[:40]}...'")
        
        # Configure the subprocess command pipeline
        # Piper takes text via standard input (stdin) and outputs directly to a target .wav file
        cmd = [
            piper_bin,
            "--model", onnx_model,
            "--output_file", output_path,
            "--length_scale", str(1.0 / speed) # In Piper, length_scale represents speed multiplier (1/speed)
        ]
        
        # Execute the Piper binary in a separate process securely and feed the text string
        process = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        stdout, stderr = process.communicate(input=clean_text)
        
        if process.returncode != 0:
            raise RuntimeError(f"Piper execution failed with code {process.returncode}. Error: {stderr}")
            
        # Verify the speech wav asset was generated successfully
        if os.path.isfile(output_path) and os.path.getsize(output_path) > 0:
            return output_path
        else:
            raise FileNotFoundError(f"Failed to generate speech audio wave file at {output_path}.")
            
    except Exception as e:
        print(f"[Piper Synthesis Error] Neural generation failed: {e}")
        # Clean up corrupted/empty files if any
        if os.path.exists(output_path):
            os.remove(output_path)
        raise e
