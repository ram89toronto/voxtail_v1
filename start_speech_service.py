#!/usr/bin/env python3
import subprocess
import sys
import os

def start_speech_service():
    """Start the FastAPI speech service"""
    os.chdir('speech_api')
    
    # Start the service
    cmd = [sys.executable, '-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000']
    
    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("Service stopped")
    except Exception as e:
        print(f"Error starting service: {e}")

if __name__ == "__main__":
    start_speech_service()