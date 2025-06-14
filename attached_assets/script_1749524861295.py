import pandas as pd
import json

# Create a comprehensive table of Apache 2.0 licensed Vosk models
vosk_models_data = [
    # English models
    {"Language": "English (US)", "Model Name": "vosk-model-small-en-us-0.15", "Size": "40M", "Type": "Small", "WER": "9.85", "Use Case": "Mobile/RPi", "License": "Apache 2.0"},
    {"Language": "English (US)", "Model Name": "vosk-model-en-us-0.22", "Size": "1.8GB", "Type": "Big", "WER": "5.69", "Use Case": "Server", "License": "Apache 2.0"},
    {"Language": "English (US)", "Model Name": "vosk-model-en-us-0.22-lgraph", "Size": "128M", "Type": "Dynamic", "WER": "7.82", "Use Case": "Dynamic vocab", "License": "Apache 2.0"},
    {"Language": "English (US)", "Model Name": "vosk-model-en-us-0.42-gigaspeech", "Size": "2.3GB", "Type": "Big", "WER": "5.64", "Use Case": "Podcasts", "License": "Apache 2.0"},
    
    # Indian English
    {"Language": "English (Indian)", "Model Name": "vosk-model-en-in-0.5", "Size": "1GB", "Type": "Big", "WER": "36.12", "Use Case": "Telecom/Broadcast", "License": "Apache 2.0"},
    {"Language": "English (Indian)", "Model Name": "vosk-model-small-en-in-0.4", "Size": "36M", "Type": "Small", "WER": "49.05", "Use Case": "Mobile", "License": "Apache 2.0"},
    
    # Chinese
    {"Language": "Chinese", "Model Name": "vosk-model-small-cn-0.22", "Size": "42M", "Type": "Small", "WER": "23.54", "Use Case": "Mobile/RPi", "License": "Apache 2.0"},
    {"Language": "Chinese", "Model Name": "vosk-model-cn-0.22", "Size": "1.3GB", "Type": "Big", "WER": "13.98", "Use Case": "Server", "License": "Apache 2.0"},
    
    # Russian
    {"Language": "Russian", "Model Name": "vosk-model-ru-0.42", "Size": "1.8GB", "Type": "Big", "WER": "4.5", "Use Case": "Server", "License": "Apache 2.0"},
    {"Language": "Russian", "Model Name": "vosk-model-small-ru-0.22", "Size": "45M", "Type": "Small", "WER": "22.71", "Use Case": "Mobile/RPi", "License": "Apache 2.0"},
    
    # French
    {"Language": "French", "Model Name": "vosk-model-small-fr-0.22", "Size": "41M", "Type": "Small", "WER": "23.95", "Use Case": "Mobile/RPi", "License": "Apache 2.0"},
    {"Language": "French", "Model Name": "vosk-model-fr-0.22", "Size": "1.4GB", "Type": "Big", "WER": "14.72", "Use Case": "Server", "License": "Apache 2.0"},
    
    # German
    {"Language": "German", "Model Name": "vosk-model-de-0.21", "Size": "1.9GB", "Type": "Big", "WER": "9.83", "Use Case": "Server", "License": "Apache 2.0"},
    {"Language": "German", "Model Name": "vosk-model-de-tuda-0.6-900k", "Size": "4.4GB", "Type": "Big", "WER": "9.48", "Use Case": "Server", "License": "Apache 2.0"},
    {"Language": "German", "Model Name": "vosk-model-small-de-0.15", "Size": "45M", "Type": "Small", "WER": "13.75", "Use Case": "Mobile/RPi", "License": "Apache 2.0"},
    
    # Spanish
    {"Language": "Spanish", "Model Name": "vosk-model-small-es-0.42", "Size": "39M", "Type": "Small", "WER": "16.02", "Use Case": "Mobile/RPi", "License": "Apache 2.0"},
    {"Language": "Spanish", "Model Name": "vosk-model-es-0.42", "Size": "1.4GB", "Type": "Big", "WER": "7.50", "Use Case": "Server", "License": "Apache 2.0"},
    
    # Other languages
    {"Language": "Portuguese", "Model Name": "vosk-model-small-pt-0.3", "Size": "31M", "Type": "Small", "WER": "68.92", "Use Case": "Mobile/RPi", "License": "Apache 2.0"},
    {"Language": "Greek", "Model Name": "vosk-model-el-gr-0.7", "Size": "1.1GB", "Type": "Big", "WER": "TBD", "Use Case": "Server", "License": "Apache 2.0"},
    {"Language": "Turkish", "Model Name": "vosk-model-small-tr-0.3", "Size": "35M", "Type": "Small", "WER": "TBD", "Use Case": "Mobile/RPi", "License": "Apache 2.0"},
    {"Language": "Vietnamese", "Model Name": "vosk-model-small-vn-0.4", "Size": "32M", "Type": "Small", "WER": "15.70", "Use Case": "Mobile/RPi", "License": "Apache 2.0"},
    {"Language": "Vietnamese", "Model Name": "vosk-model-vn-0.4", "Size": "78M", "Type": "Medium", "WER": "15.70", "Use Case": "Server", "License": "Apache 2.0"},
    {"Language": "Italian", "Model Name": "vosk-model-small-it-0.22", "Size": "48M", "Type": "Small", "WER": "16.88", "Use Case": "Mobile/RPi", "License": "Apache 2.0"},
    {"Language": "Italian", "Model Name": "vosk-model-it-0.22", "Size": "1.2GB", "Type": "Big", "WER": "8.10", "Use Case": "Server", "License": "Apache 2.0"},
    {"Language": "Dutch", "Model Name": "vosk-model-small-nl-0.22", "Size": "39M", "Type": "Small", "WER": "22.45", "Use Case": "Mobile/RPi", "License": "Apache 2.0"},
    {"Language": "Catalan", "Model Name": "vosk-model-small-ca-0.4", "Size": "42M", "Type": "Small", "WER": "TBD", "Use Case": "Mobile/RPi", "License": "Apache 2.0"},
    {"Language": "Arabic", "Model Name": "vosk-model-ar-mgb2-0.4", "Size": "318M", "Type": "Medium", "WER": "16.40", "Use Case": "General", "License": "Apache 2.0"},
    {"Language": "Arabic (Tunisian)", "Model Name": "vosk-model-small-ar-tn-0.1-linto", "Size": "158M", "Type": "Small", "WER": "16.06", "Use Case": "General", "License": "Apache 2.0"},
    {"Language": "Arabic (Tunisian)", "Model Name": "vosk-model-ar-tn-0.1-linto", "Size": "517M", "Type": "Medium", "WER": "16.06", "Use Case": "General", "License": "Apache 2.0"},
    {"Language": "Farsi (Persian)", "Model Name": "vosk-model-fa-0.42", "Size": "1.6GB", "Type": "Big", "WER": "16.7", "Use Case": "Server", "License": "Apache 2.0"},
    {"Language": "Farsi (Persian)", "Model Name": "vosk-model-small-fa-0.42", "Size": "53M", "Type": "Small", "WER": "23.4", "Use Case": "Mobile/Desktop", "License": "Apache 2.0"},
    {"Language": "Ukrainian", "Model Name": "vosk-model-small-uk-v3-nano", "Size": "73M", "Type": "Nano", "WER": "TBD", "Use Case": "Mobile", "License": "Apache 2.0"},
    {"Language": "Ukrainian", "Model Name": "vosk-model-small-uk-v3-small", "Size": "133M", "Type": "Small", "WER": "TBD", "Use Case": "Desktop", "License": "Apache 2.0"},
    {"Language": "Ukrainian", "Model Name": "vosk-model-uk-v3", "Size": "343M", "Type": "Medium", "WER": "TBD", "Use Case": "Server", "License": "Apache 2.0"},
    {"Language": "Ukrainian", "Model Name": "vosk-model-uk-v3-lgraph", "Size": "325M", "Type": "Dynamic", "WER": "TBD", "Use Case": "Dynamic vocab", "License": "Apache 2.0"},
    {"Language": "Kazakh", "Model Name": "vosk-model-small-kz-0.15", "Size": "42M", "Type": "Small", "WER": "9.60", "Use Case": "Mobile", "License": "Apache 2.0"},
    {"Language": "Kazakh", "Model Name": "vosk-model-kz-0.15", "Size": "378M", "Type": "Medium", "WER": "8.06", "Use Case": "Server", "License": "Apache 2.0"},
    {"Language": "Japanese", "Model Name": "vosk-model-small-ja-0.22", "Size": "48M", "Type": "Small", "WER": "9.52", "Use Case": "Mobile/RPi", "License": "Apache 2.0"},
    {"Language": "Japanese", "Model Name": "vosk-model-ja-0.22", "Size": "1GB", "Type": "Big", "WER": "8.40", "Use Case": "Server", "License": "Apache 2.0"},
    {"Language": "Esperanto", "Model Name": "vosk-model-small-eo-0.42", "Size": "42M", "Type": "Small", "WER": "7.24", "Use Case": "Mobile/RPi", "License": "Apache 2.0"},
    {"Language": "Hindi", "Model Name": "vosk-model-small-hi-0.22", "Size": "42M", "Type": "Small", "WER": "20.89", "Use Case": "Mobile/RPi", "License": "Apache 2.0"},
    {"Language": "Hindi", "Model Name": "vosk-model-hi-0.22", "Size": "1.5GB", "Type": "Big", "WER": "14.85", "Use Case": "Server", "License": "Apache 2.0"},
    {"Language": "Polish", "Model Name": "vosk-model-small-pl-0.22", "Size": "50M", "Type": "Small", "WER": "18.36", "Use Case": "Mobile/RPi", "License": "Apache 2.0"},
    {"Language": "Uzbek", "Model Name": "vosk-model-small-uz-0.22", "Size": "49M", "Type": "Small", "WER": "13.54", "Use Case": "Mobile/RPi", "License": "Apache 2.0"},
    {"Language": "Korean", "Model Name": "vosk-model-small-ko-0.22", "Size": "82M", "Type": "Small", "WER": "28.1", "Use Case": "Mobile/RPi", "License": "Apache 2.0"},
    {"Language": "Gujarati", "Model Name": "vosk-model-gu-0.42", "Size": "700M", "Type": "Big", "WER": "16.45", "Use Case": "Server", "License": "Apache 2.0"},
    {"Language": "Gujarati", "Model Name": "vosk-model-small-gu-0.42", "Size": "100M", "Type": "Small", "WER": "20.49", "Use Case": "Mobile/RPi", "License": "Apache 2.0"},
    {"Language": "Tajik", "Model Name": "vosk-model-tg-0.22", "Size": "327M", "Type": "Medium", "WER": "41.1", "Use Case": "Server", "License": "Apache 2.0"},
    {"Language": "Tajik", "Model Name": "vosk-model-small-tg-0.22", "Size": "50M", "Type": "Small", "WER": "38.4", "Use Case": "Mobile/RPi", "License": "Apache 2.0"},
    {"Language": "Telugu", "Model Name": "vosk-model-small-te-0.42", "Size": "58M", "Type": "Small", "WER": "87.9", "Use Case": "Mobile/RPi", "License": "Apache 2.0"},
]

# Create DataFrame
df_models = pd.DataFrame(vosk_models_data)

# Save to CSV
df_models.to_csv("vosk_apache2_models.csv", index=False)

print("Vosk Apache 2.0 Models Overview:")
print(f"Total models: {len(df_models)}")
print(f"Languages supported: {df_models['Language'].nunique()}")
print("\nLanguage coverage:")
print(df_models['Language'].value_counts())

# Display first few rows
print("\nSample of available models:")
print(df_models.head(10).to_string(index=False))

# Create summary statistics
summary_stats = {
    "Total Apache 2.0 Models": len(df_models),
    "Languages Supported": df_models['Language'].nunique(),
    "Small Models": len(df_models[df_models['Type'] == 'Small']),
    "Big Models": len(df_models[df_models['Type'] == 'Big']),
    "Dynamic Models": len(df_models[df_models['Type'] == 'Dynamic']),
    "Average WER (Small Models)": df_models[(df_models['Type'] == 'Small') & (df_models['WER'] != 'TBD')]['WER'].astype(float).mean(),
    "Average WER (Big Models)": df_models[(df_models['Type'] == 'Big') & (df_models['WER'] != 'TBD')]['WER'].astype(float).mean()
}

print("\n" + "="*50)
print("SUMMARY STATISTICS")
print("="*50)
for key, value in summary_stats.items():
    if isinstance(value, float):
        print(f"{key}: {value:.2f}")
    else:
        print(f"{key}: {value}")