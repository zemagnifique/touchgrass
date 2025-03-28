#!/usr/bin/env python3

import os
from pydub import AudioSegment
from pydub.silence import split_on_silence, detect_nonsilent

def split_audio_on_silence(input_file, output_dir, min_silence_len=2000, silence_thresh=-40):
    """
    Split an audio file based on silence detection.
    
    Args:
        input_file (str): Path to input audio file
        output_dir (str): Directory to save split audio files
        min_silence_len (int): Minimum length of silence in milliseconds (default: 3000ms = 3s)
        silence_thresh (int): Silence threshold in dB (default: -40dB)
    """
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Load audio file
    print(f"Loading audio file: {input_file}")
    audio = AudioSegment.from_mp3(input_file)
    
    # Split audio on silence
    print("Detecting silence and splitting audio...")
    chunks = split_on_silence(
        audio,
        min_silence_len=min_silence_len,
        silence_thresh=silence_thresh,
        keep_silence=500  # Keep 500ms of silence at the end of each chunk
    )
    
    # Export each chunk
    print(f"Exporting {len(chunks)} audio segments...")
    for i, chunk in enumerate(chunks):
        output_file = os.path.join(output_dir, f"chunk_{i:03d}.mp3")
        chunk.export(output_file, format="mp3")
        print(f"Exported: {output_file}")

if __name__ == "__main__":
    input_file = "public/sounds/newtouch/newtouch.mp3"
    output_dir = "public/sounds/newtouch"
    
    split_audio_on_silence(input_file, output_dir)
    print("Audio splitting completed!") 