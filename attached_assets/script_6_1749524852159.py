# Create a comprehensive setup script

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
    print("📁 Creating directory structure...")
    
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
    
    print("✅ Directory structure created")

def install_dependencies():
    """Install Python dependencies"""
    print("📦 Installing Python dependencies...")
    
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
        
        print("✅ Dependencies installed successfully")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing dependencies: {e}")
        return False

def download_model(language, model_type):
    """Download a specific Vosk model"""
    print(f"📥 Downloading {language} ({model_type}) model...")
    
    try:
        # Import here to ensure dependencies are installed
        from app.model_manager import ModelManager
        
        manager = ModelManager()
        
        def progress_callback(message):
            print(f"  {message}")
        
        success = manager.download_model(language, model_type, progress_callback)
        
        if success:
            print(f"✅ Successfully downloaded {language} ({model_type}) model")
        else:
            print(f"❌ Failed to download {language} ({model_type}) model")
            
        return success
        
    except ImportError as e:
        print(f"❌ Could not import ModelManager: {e}")
        print("Make sure all dependencies are installed first")
        return False
    except Exception as e:
        print(f"❌ Error downloading model: {e}")
        return False

def download_recommended_models():
    """Download a set of recommended models for testing"""
    print("📥 Downloading recommended models for testing...")
    
    # Recommended models for initial setup (small models for faster download)
    recommended = [
        ("English (US)", "small"),
        ("French", "small"),
        ("German", "small"),
        ("Spanish", "small")
    ]
    
    success_count = 0
    for language, model_type in recommended:
        if download_model(language, model_type):
            success_count += 1
    
    print(f"✅ Successfully downloaded {success_count}/{len(recommended)} recommended models")
    return success_count > 0

def create_example_files():
    """Create example configuration and usage files"""
    print("📝 Creating example files...")
    
    # Create example streamlit config
    streamlit_config = '''[general]
dataFrameSerialization = "legacy"

[server]
port = 8501
address = "0.0.0.0"

[browser]
gatherUsageStats = false

[theme]
primaryColor = "#FF6B6B"
backgroundColor = "#FFFFFF"
secondaryBackgroundColor = "#F0F2F6"
textColor = "#262730"
'''
    
    streamlit_dir = Path(".streamlit")
    streamlit_dir.mkdir(exist_ok=True)
    
    with open(streamlit_dir / "config.toml", "w") as f:
        f.write(streamlit_config)
    
    # Create example run script
    run_script = '''#!/bin/bash
# Run the Streamlit app

echo "🚀 Starting Streamlit Vosk Speech-to-Text App..."
echo "📱 Open your browser to http://localhost:8501"
echo ""

# Set environment variables
export STREAMLIT_SERVER_PORT=8501
export STREAMLIT_SERVER_ADDRESS=0.0.0.0

# Run the app
streamlit run app/main.py --server.port 8501

# Alternative: Run with custom config
# streamlit run app/main.py --server.port 8501 --server.address 0.0.0.0
'''
    
    with open("run_app.sh", "w") as f:
        f.write(run_script)
    
    # Make script executable on Unix systems
    if os.name != 'nt':  # Not Windows
        os.chmod("run_app.sh", 0o755)
    
    # Create Windows batch file
    windows_script = '''@echo off
echo 🚀 Starting Streamlit Vosk Speech-to-Text App...
echo 📱 Open your browser to http://localhost:8501
echo.

streamlit run app/main.py --server.port 8501
pause
'''
    
    with open("run_app.bat", "w") as f:
        f.write(windows_script)
    
    print("✅ Example files created")

def verify_installation():
    """Verify that the installation was successful"""
    print("🔍 Verifying installation...")
    
    try:
        # Test imports
        import streamlit
        import vosk
        import soundfile
        import librosa
        import numpy
        import pandas
        import requests
        import yaml
        
        print(f"✅ Streamlit version: {streamlit.__version__}")
        print(f"✅ Vosk available")
        print(f"✅ Audio processing libraries available")
        print(f"✅ All dependencies verified")
        
        return True
        
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Setup Streamlit Vosk Speech-to-Text App")
    parser.add_argument("--download-models", action="store_true", 
                       help="Download recommended models")
    parser.add_argument("--language", type=str, 
                       help="Specific language to download")
    parser.add_argument("--model-type", type=str, choices=["small", "large", "dynamic"],
                       default="small", help="Model type to download")
    
    args = parser.parse_args()
    
    print("🎤 Streamlit Vosk Speech-to-Text App Setup")
    print("=" * 50)
    
    # Step 1: Create directory structure
    create_directory_structure()
    
    # Step 2: Install dependencies
    if not install_dependencies():
        print("❌ Setup failed at dependency installation")
        return 1
    
    # Step 3: Create example files
    create_example_files()
    
    # Step 4: Verify installation
    if not verify_installation():
        print("❌ Setup failed at verification")
        return 1
    
    # Step 5: Download models if requested
    if args.language:
        download_model(args.language, args.model_type)
    elif args.download_models:
        download_recommended_models()
    else:
        print("ℹ️  Skipping model download (use --download-models to download)")
    
    print("\n🎉 Setup completed successfully!")
    print("\nNext steps:")
    print("1. Run the app:")
    print("   • Linux/Mac: ./run_app.sh")
    print("   • Windows: run_app.bat")
    print("   • Manual: streamlit run app/main.py")
    print("2. Open http://localhost:8501 in your browser")
    print("3. Download models using the app interface")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
'''

# Save the setup script
with open("setup.py", "w") as f:
    f.write(setup_script_code)

print("✅ Created comprehensive setup script: setup.py")
print(f"Lines of code: {len(setup_script_code.splitlines())}")

# Create a README template
readme_content = '''# 🎤 Multi-Language Speech-to-Text with Vosk

A comprehensive Streamlit application for offline speech recognition supporting 28+ languages using Apache 2.0 licensed Vosk models.

## 🌟 Features

- **Offline Recognition**: No internet required after model download
- **28+ Languages**: Support for major world languages
- **Real-time Processing**: Live microphone input and file upload
- **Apache 2.0 Licensed**: Free for commercial use
- **Model Management**: Automatic download and caching of models
- **User-friendly Interface**: Clean Streamlit web interface

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <your-repository>
cd streamlit-vosk-stt
python setup.py --download-models
```

### 2. Run the Application

```bash
# Linux/Mac
./run_app.sh

# Windows
run_app.bat

# Manual
streamlit run app/main.py
```

### 3. Open Browser

Navigate to `http://localhost:8501` and start using the application!

## 📋 Requirements

- Python 3.8+
- 2GB+ available disk space (for models)
- Microphone (for live recording)

## 🛠️ Installation Options

### Option 1: Automated Setup (Recommended)
```bash
python setup.py --download-models
```

### Option 2: Manual Setup
```bash
pip install -r requirements.txt
python -c "from app.model_manager import ModelManager; ModelManager().download_model('English (US)', 'small')"
streamlit run app/main.py
```

## 📊 Supported Models

| Language | Small Model | Large Model | Best WER |
|----------|-------------|-------------|----------|
| English (US) | 40MB (9.85% WER) | 2.3GB (5.64% WER) | 5.64% |
| Russian | 45MB (22.71% WER) | 1.8GB (4.5% WER) | 4.5% |
| German | 45MB (13.75% WER) | 4.4GB (9.48% WER) | 9.48% |
| Spanish | 39MB (16.02% WER) | 1.4GB (7.5% WER) | 7.5% |
| French | 41MB (23.95% WER) | 1.4GB (14.72% WER) | 14.72% |

*WER = Word Error Rate (lower is better)*

## 🔧 Configuration

Edit `config.yaml` to customize:

- Model download URLs
- Audio processing settings
- UI preferences
- Performance tuning

## 📁 Project Structure

```
streamlit-vosk-stt/
├── app/                    # Main application code
├── models/                 # Downloaded Vosk models
├── config/                 # Configuration files
├── tests/                  # Unit tests
├── docs/                   # Documentation
└── requirements.txt        # Dependencies
```

## 🚀 Deployment

### Streamlit Cloud
1. Push to GitHub
2. Connect to Streamlit Cloud
3. Deploy automatically

### Docker
```bash
docker build -t vosk-stt .
docker run -p 8501:8501 vosk-stt
```

## 📄 License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 🆘 Troubleshooting

### Common Issues

**Model download fails:**
- Check internet connection
- Verify disk space (models can be several GB)
- Try downloading smaller models first

**Audio not working:**
- Check microphone permissions in browser
- Ensure audio format is supported (WAV, MP3, FLAC)
- Try refreshing the page

**Performance issues:**
- Use smaller models for faster processing
- Enable caching in config
- Close other applications using microphone

## 📞 Support

- 📖 Documentation: See `/docs` folder
- 🐛 Issues: Create GitHub issue
- 💬 Discussions: GitHub Discussions

## 🙏 Acknowledgments

- [Vosk](https://alphacephei.com/vosk/) for speech recognition models
- [Streamlit](https://streamlit.io) for the web framework
- [Alpha Cephei](https://alphacephei.com/) for maintaining Vosk
'''

with open("README.md", "w") as f:
    f.write(readme_content)

print("✅ Created README.md template")

print("\n" + "="*60)
print("COMPLETE PROJECT TEMPLATE GENERATED")
print("="*60)
print("📁 Project structure defined")
print("🐍 Python code components created")
print("⚙️ Configuration files ready")
print("📋 Setup automation script")
print("📖 Documentation template")
print("🚀 Ready for development and deployment!")

print(f"\nTotal files created in this session:")
files_created = [
    "vosk_apache2_models.csv",
    "streamlit_vosk_project_structure.md", 
    "streamlit_main_app.py",
    "model_manager.py",
    "speech_recognizer.py",
    "requirements.txt",
    "packages.txt",
    ".gitignore",
    "config.yaml",
    "LICENSE",
    "best_models_summary.csv",
    "deployment_timeline.csv",
    "feature_comparison.csv",
    "model_comparison_data.json",
    "setup.py",
    "README.md"
]

for i, filename in enumerate(files_created, 1):
    print(f"{i:2d}. {filename}")

print(f"\n📊 Total: {len(files_created)} files ready for your Vosk Streamlit project!")