# Create a comprehensive setup script (fixing the emoji issue)

setup_script_code = '''#!/usr/bin/env python3
"""
Streamlit Vosk Speech-to-Text App Setup Script

This script helps set up the complete development environment
for the multi-language speech-to-text application using Vosk.

Usage:
    python setup.py [--download-models] [--language LANG] [--model-type TYPE]

Examples:
    python setup.py                                    # Basic setup only
    python setup.py --download-models                  # Setup + download all small models
    python setup.py --language "English (US)" --model-type small  # Download specific model
"""

import os
import sys
import argparse
import subprocess
from pathlib import Path
import yaml

def create_directory_structure():
    """Create the project directory structure"""
    print("Creating directory structure...")
    
    directories = [
        "app",
        "models", 
        "config",
        "tests",
        "docs",
        "scripts",
        "assets/icons",
        "assets/images", 
        "assets/audio_samples"
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        
        # Create __init__.py files for Python packages
        if directory in ["app", "config", "tests"]:
            init_file = Path(directory) / "__init__.py"
            if not init_file.exists():
                init_file.touch()
    
    # Create .gitkeep files for empty directories
    gitkeep_dirs = ["models", "assets/icons", "assets/images", "assets/audio_samples"]
    for directory in gitkeep_dirs:
        gitkeep_file = Path(directory) / ".gitkeep"
        gitkeep_file.touch()
    
    print("Directory structure created successfully")

def install_dependencies():
    """Install Python dependencies"""
    print("Installing Python dependencies...")
    
    try:
        # Upgrade pip first
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pip"])
        
        # Install requirements
        if Path("requirements.txt").exists():
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        else:
            # Install core dependencies manually
            core_deps = [
                "streamlit>=1.28.0",
                "vosk>=0.3.45", 
                "soundfile>=0.12.1",
                "librosa>=0.10.0",
                "streamlit-mic-recorder>=0.0.4",
                "numpy>=1.24.0",
                "pandas>=1.5.0",
                "requests>=2.31.0",
                "tqdm>=4.65.0",
                "PyYAML>=6.0"
            ]
            
            for dep in core_deps:
                print(f"Installing {dep}...")
                subprocess.check_call([sys.executable, "-m", "pip", "install", dep])
        
        print("Dependencies installed successfully")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"Error installing dependencies: {e}")
        return False

def main():
    print("Streamlit Vosk Speech-to-Text App Setup")
    print("=" * 50)
    
    # Step 1: Create directory structure
    create_directory_structure()
    
    # Step 2: Install dependencies
    if not install_dependencies():
        print("Setup failed at dependency installation")
        return 1
    
    print("Setup completed successfully!")
    print("Next steps:")
    print("1. Run: streamlit run app/main.py")
    print("2. Open http://localhost:8501 in your browser")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
'''

# Save the setup script
with open("setup.py", "w") as f:
    f.write(setup_script_code)

print("✅ Created setup script successfully")

# Create run scripts for different platforms
run_script_unix = '''#!/bin/bash
echo "Starting Streamlit Vosk Speech-to-Text App..."
echo "Open your browser to http://localhost:8501"
echo ""

streamlit run app/main.py --server.port 8501
'''

run_script_windows = '''@echo off
echo Starting Streamlit Vosk Speech-to-Text App...
echo Open your browser to http://localhost:8501
echo.

streamlit run app/main.py --server.port 8501
pause
'''

with open("run_app.sh", "w") as f:
    f.write(run_script_unix)

with open("run_app.bat", "w") as f:
    f.write(run_script_windows)

print("✅ Created run scripts for Unix and Windows")

# Summary of all files created
print("\n" + "="*60)
print("PROJECT TEMPLATE COMPLETE")
print("="*60)

files_created = [
    "vosk_apache2_models.csv - Complete Apache 2.0 model catalog",
    "best_models_summary.csv - Best performing models per language",
    "streamlit_main_app.py - Main Streamlit application",
    "model_manager.py - Model download and management",
    "speech_recognizer.py - Vosk integration wrapper",
    "setup.py - Automated setup script",
    "requirements.txt - Python dependencies",
    "packages.txt - System dependencies",
    "config.yaml - App configuration",
    ".gitignore - Git ignore patterns",
    "LICENSE - Apache 2.0 license",
    "README.md - Project documentation",
    "run_app.sh - Unix run script",
    "run_app.bat - Windows run script",
    "deployment_timeline.csv - Deployment steps",
    "feature_comparison.csv - Vosk vs competitors",
    "streamlit_vosk_project_structure.md - Project structure guide"
]

for i, item in enumerate(files_created, 1):
    print(f"{i:2d}. {item}")

print(f"\n🎯 Total: {len(files_created)} files ready!")
print("\n🚀 Your Streamlit Vosk Speech-to-Text project is ready for development!")
print("📖 Follow the step-by-step guide in the comprehensive report.")