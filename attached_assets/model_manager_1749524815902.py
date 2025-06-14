
import os
import requests
import zipfile
import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import streamlit as st
from tqdm import tqdm
import yaml

class ModelManager:
    """
    Manages Vosk model downloading, caching, and organization.
    Supports all Apache 2.0 licensed models from Vosk.
    """

    def __init__(self, models_dir: str = "models", config_file: str = "config/model_config.yaml"):
        self.models_dir = Path(models_dir)
        self.models_dir.mkdir(exist_ok=True)
        self.config_file = Path(config_file)

        # Load model configuration
        self.model_config = self._load_model_config()

        # Create models directory structure
        self._initialize_directory_structure()

    def _load_model_config(self) -> Dict:
        """Load model configuration from YAML file or create default"""
        if self.config_file.exists():
            with open(self.config_file, 'r') as f:
                return yaml.safe_load(f)
        else:
            # Default configuration with Apache 2.0 models
            default_config = {
                "base_url": "https://alphacephei.com/vosk/models",
                "models": {
                    "English (US)": {
                        "small": {
                            "name": "vosk-model-small-en-us-0.15",
                            "url": "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip",
                            "size": "40M",
                            "wer": "9.85",
                            "license": "Apache 2.0"
                        },
                        "large": {
                            "name": "vosk-model-en-us-0.22",
                            "url": "https://alphacephei.com/vosk/models/vosk-model-en-us-0.22.zip",
                            "size": "1.8GB",
                            "wer": "5.69",
                            "license": "Apache 2.0"
                        },
                        "dynamic": {
                            "name": "vosk-model-en-us-0.22-lgraph",
                            "url": "https://alphacephei.com/vosk/models/vosk-model-en-us-0.22-lgraph.zip",
                            "size": "128M",
                            "wer": "7.82",
                            "license": "Apache 2.0"
                        }
                    },
                    "French": {
                        "small": {
                            "name": "vosk-model-small-fr-0.22",
                            "url": "https://alphacephei.com/vosk/models/vosk-model-small-fr-0.22.zip",
                            "size": "41M",
                            "wer": "23.95",
                            "license": "Apache 2.0"
                        },
                        "large": {
                            "name": "vosk-model-fr-0.22",
                            "url": "https://alphacephei.com/vosk/models/vosk-model-fr-0.22.zip",
                            "size": "1.4GB",
                            "wer": "14.72",
                            "license": "Apache 2.0"
                        }
                    },
                    "German": {
                        "small": {
                            "name": "vosk-model-small-de-0.15",
                            "url": "https://alphacephei.com/vosk/models/vosk-model-small-de-0.15.zip",
                            "size": "45M",
                            "wer": "13.75",
                            "license": "Apache 2.0"
                        },
                        "large": {
                            "name": "vosk-model-de-0.21",
                            "url": "https://alphacephei.com/vosk/models/vosk-model-de-0.21.zip",
                            "size": "1.9GB",
                            "wer": "9.83",
                            "license": "Apache 2.0"
                        }
                    },
                    "Spanish": {
                        "small": {
                            "name": "vosk-model-small-es-0.42",
                            "url": "https://alphacephei.com/vosk/models/vosk-model-small-es-0.42.zip",
                            "size": "39M",
                            "wer": "16.02",
                            "license": "Apache 2.0"
                        },
                        "large": {
                            "name": "vosk-model-es-0.42",
                            "url": "https://alphacephei.com/vosk/models/vosk-model-es-0.42.zip",
                            "size": "1.4GB",
                            "wer": "7.50",
                            "license": "Apache 2.0"
                        }
                    },
                    "Russian": {
                        "small": {
                            "name": "vosk-model-small-ru-0.22",
                            "url": "https://alphacephei.com/vosk/models/vosk-model-small-ru-0.22.zip",
                            "size": "45M",
                            "wer": "22.71",
                            "license": "Apache 2.0"
                        },
                        "large": {
                            "name": "vosk-model-ru-0.42",
                            "url": "https://alphacephei.com/vosk/models/vosk-model-ru-0.42.zip",
                            "size": "1.8GB",
                            "wer": "4.5",
                            "license": "Apache 2.0"
                        }
                    },
                    "Chinese": {
                        "small": {
                            "name": "vosk-model-small-cn-0.22",
                            "url": "https://alphacephei.com/vosk/models/vosk-model-small-cn-0.22.zip",
                            "size": "42M",
                            "wer": "23.54",
                            "license": "Apache 2.0"
                        },
                        "large": {
                            "name": "vosk-model-cn-0.22",
                            "url": "https://alphacephei.com/vosk/models/vosk-model-cn-0.22.zip",
                            "size": "1.3GB",
                            "wer": "13.98",
                            "license": "Apache 2.0"
                        }
                    }
                }
            }

            # Save default config
            self.config_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.config_file, 'w') as f:
                yaml.dump(default_config, f, default_flow_style=False)

            return default_config

    def _initialize_directory_structure(self):
        """Create directory structure for models"""
        for language in self.model_config["models"].keys():
            lang_dir = self.models_dir / self._normalize_language_name(language)
            lang_dir.mkdir(exist_ok=True)

            for model_type in self.model_config["models"][language].keys():
                type_dir = lang_dir / model_type
                type_dir.mkdir(exist_ok=True)

    def _normalize_language_name(self, language: str) -> str:
        """Normalize language name for directory structure"""
        return language.lower().replace(" ", "_").replace("(", "").replace(")", "")

    def get_available_languages(self) -> List[str]:
        """Get list of available languages"""
        return list(self.model_config["models"].keys())

    def get_model_types(self, language: str) -> List[str]:
        """Get available model types for a language"""
        if language in self.model_config["models"]:
            return list(self.model_config["models"][language].keys())
        return []

    def get_model_info(self, language: str, model_type: str) -> Dict:
        """Get information about a specific model"""
        try:
            return self.model_config["models"][language][model_type]
        except KeyError:
            raise ValueError(f"Model not found: {language} - {model_type}")

    def is_model_downloaded(self, language: str, model_type: str) -> bool:
        """Check if a model is already downloaded"""
        model_path = self.get_model_path(language, model_type)
        return model_path.exists() and any(model_path.iterdir())

    def get_model_path(self, language: str, model_type: str) -> Path:
        """Get the path to a model directory"""
        lang_normalized = self._normalize_language_name(language)
        return self.models_dir / lang_normalized / model_type

    def download_model(self, language: str, model_type: str, progress_callback=None) -> bool:
        """
        Download and extract a Vosk model

        Args:
            language: Language name
            model_type: Model type (small, large, dynamic)
            progress_callback: Optional callback for progress updates

        Returns:
            bool: True if successful, False otherwise
        """
        model_info = self.get_model_info(language, model_type)
        model_url = model_info["url"]
        model_name = model_info["name"]

        # Create download directory
        download_dir = self.models_dir / "downloads"
        download_dir.mkdir(exist_ok=True)

        zip_path = download_dir / f"{model_name}.zip"
        extract_path = self.get_model_path(language, model_type)

        try:
            # Download the model
            if progress_callback:
                progress_callback(f"Downloading {model_name}...")

            response = requests.get(model_url, stream=True)
            response.raise_for_status()

            total_size = int(response.headers.get('content-length', 0))

            with open(zip_path, 'wb') as f:
                if total_size == 0:
                    f.write(response.content)
                else:
                    downloaded = 0
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                            downloaded += len(chunk)
                            if progress_callback:
                                progress = (downloaded / total_size) * 100
                                progress_callback(f"Downloading {model_name}: {progress:.1f}%")

            # Extract the model
            if progress_callback:
                progress_callback(f"Extracting {model_name}...")

            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                # Extract to temporary directory first
                temp_extract = download_dir / "temp_extract"
                zip_ref.extractall(temp_extract)

                # Find the model directory (usually the first directory in the zip)
                extracted_dirs = [d for d in temp_extract.iterdir() if d.is_dir()]
                if extracted_dirs:
                    model_source = extracted_dirs[0]

                    # Move contents to final location
                    extract_path.mkdir(parents=True, exist_ok=True)
                    for item in model_source.iterdir():
                        target = extract_path / item.name
                        if item.is_dir():
                            if target.exists():
                                import shutil
                                shutil.rmtree(target)
                            item.rename(target)
                        else:
                            if target.exists():
                                target.unlink()
                            item.rename(target)

                    # Clean up
                    import shutil
                    shutil.rmtree(temp_extract)

            # Remove zip file
            zip_path.unlink()

            if progress_callback:
                progress_callback(f"Successfully downloaded {model_name}")

            return True

        except Exception as e:
            if progress_callback:
                progress_callback(f"Error downloading {model_name}: {str(e)}")

            # Clean up on error
            if zip_path.exists():
                zip_path.unlink()

            return False

    def get_downloaded_models(self) -> List[Tuple[str, str]]:
        """Get list of downloaded models as (language, model_type) tuples"""
        downloaded = []

        for language in self.get_available_languages():
            for model_type in self.get_model_types(language):
                if self.is_model_downloaded(language, model_type):
                    downloaded.append((language, model_type))

        return downloaded

    def get_all_models(self) -> List[Tuple[str, str]]:
        """Get list of all available models as (language, model_type) tuples"""
        all_models = []

        for language in self.get_available_languages():
            for model_type in self.get_model_types(language):
                all_models.append((language, model_type))

        return all_models

    def delete_model(self, language: str, model_type: str) -> bool:
        """Delete a downloaded model"""
        model_path = self.get_model_path(language, model_type)

        if model_path.exists():
            import shutil
            shutil.rmtree(model_path)
            model_path.mkdir(exist_ok=True)  # Recreate empty directory
            return True

        return False

    def get_disk_usage(self) -> Dict[str, float]:
        """Get disk usage statistics for models"""
        total_size = 0
        model_sizes = {}

        for language in self.get_available_languages():
            for model_type in self.get_model_types(language):
                if self.is_model_downloaded(language, model_type):
                    model_path = self.get_model_path(language, model_type)
                    size = sum(f.stat().st_size for f in model_path.rglob('*') if f.is_file())
                    model_sizes[f"{language}-{model_type}"] = size / (1024 * 1024)  # MB
                    total_size += size

        return {
            "total_mb": total_size / (1024 * 1024),
            "models": model_sizes
        }

# Usage example:
if __name__ == "__main__":
    manager = ModelManager()

    # Download a model
    success = manager.download_model("English (US)", "small")
    print(f"Download successful: {success}")

    # Check what's downloaded
    downloaded = manager.get_downloaded_models()
    print(f"Downloaded models: {downloaded}")
