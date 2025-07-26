use serde::{Deserialize, Serialize};
use tauri::{Emitter, Listener};
use std::env;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};

#[derive(Debug, Serialize, Deserialize)]
pub struct TranslationRequest {
    pub text: String,
    pub target_language: String,
    pub api_key: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TranslationResponse {
    pub success: bool,
    pub translated_text: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AudioRecordingResult {
    pub success: bool,
    pub audio_data: Option<Vec<f32>>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TranscriptionResult {
    pub success: bool,
    pub transcription: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SummarizeRequest {
    pub text: String,
    pub api_key: String,
}

// Global audio recording state
lazy_static::lazy_static! {
    static ref AUDIO_DATA: Arc<Mutex<Vec<f32>>> = Arc::new(Mutex::new(Vec::new()));
    static ref IS_RECORDING: Arc<AtomicBool> = Arc::new(AtomicBool::new(false));
}

#[tauri::command]
async fn translate_text(request: TranslationRequest) -> Result<TranslationResponse, String> {
    let client = reqwest::Client::new();
    
    let payload = serde_json::json!({
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": format!("You are a professional translator. Translate the given text to {}. Only respond with the translation, no explanations or additional text.", request.target_language)
            },
            {
                "role": "user",
                "content": request.text
            }
        ],
        "temperature": 0.3,
        "max_tokens": 1000,
        "stream": true
    });

    match client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", request.api_key))
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<serde_json::Value>().await {
                    Ok(data) => {
                        if let Some(content) = data["choices"][0]["message"]["content"].as_str() {
                            Ok(TranslationResponse {
                                success: true,
                                translated_text: Some(content.to_string()),
                                error: None,
                            })
                        } else {
                            Ok(TranslationResponse {
                                success: false,
                                translated_text: None,
                                error: Some("No translation content in response".to_string()),
                            })
                        }
                    }
                    Err(e) => Ok(TranslationResponse {
                        success: false,
                        translated_text: None,
                        error: Some(format!("Failed to parse response: {}", e)),
                    }),
                }
            } else {
                Ok(TranslationResponse {
                    success: false,
                    translated_text: None,
                    error: Some(format!("HTTP error: {}", response.status())),
                })
            }
        }
        Err(e) => Ok(TranslationResponse {
            success: false,
            translated_text: None,
            error: Some(format!("Request failed: {}", e)),
        }),
    }
}

#[tauri::command]
async fn get_clipboard_text() -> Result<String, String> {
    // This will be handled by the frontend using the clipboard plugin
    Ok("".to_string())
}

#[tauri::command]
async fn show_translation_window(app_handle: tauri::AppHandle, text: String, target_language: String) -> Result<(), String> {
    let window = tauri::WebviewWindowBuilder::new(
        &app_handle,
        "translation",
        tauri::WebviewUrl::App("translation.html".into())
    )
    .title("Translation")
    .inner_size(600.0, 400.0)
    .center()
    .resizable(true)
    .build()
    .map_err(|e| e.to_string())?;
    
    // Wait a moment for the window to load, then send the text
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    // Send the clipboard text and target language to the window
    let _ = window.emit("clipboard-text", &text);
    let _ = window.emit("target-language", &target_language);
    
    // Start the translation with the WebviewWindow
    let _ = stream_translate_webview(TranslationRequest {
        text,
        target_language,
        api_key: "dummy".to_string()
    }, window).await;
    
    Ok(())
}

async fn stream_translate_webview(request: TranslationRequest, window: tauri::WebviewWindow) -> Result<(), String> {
    use tokio_stream::StreamExt;
    
    // Read API key from environment variable
    let api_key = env::var("OPENAI_API_KEY")
        .map_err(|_| "OPENAI_API_KEY environment variable not found. Please check your .env file.".to_string())?;
    
    let client = reqwest::Client::new();
    
    let payload = serde_json::json!({
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": format!("You are a professional translator. Translate the given text to {}. Only respond with the translation, no explanations or additional text.", request.target_language)
            },
            {
                "role": "user",
                "content": request.text
            }
        ],
        "temperature": 0.3,
        "max_tokens": 1000,
        "stream": true
    });

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = response.status();
    if !status.is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("HTTP error: {} - {}", status, error_text));
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        let chunk_str = String::from_utf8_lossy(&chunk);
        
        for line in chunk_str.lines() {
            if line.starts_with("data: ") {
                let data = &line[6..]; // Remove "data: " prefix
                
                if data == "[DONE]" {
                    break;
                }
                
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                    if let Some(content) = json["choices"][0]["delta"]["content"].as_str() {
                        buffer.push_str(content);
                        
                        // Emit the chunk to the frontend
                        let _ = window.emit("translation-chunk", content);
                    }
                }
            }
        }
    }

    // Emit completion
    let _ = window.emit("translation-complete", &buffer);
    
    Ok(())
}

#[tauri::command]
async fn stream_translate(_request: TranslationRequest, _window: tauri::Window) -> Result<(), String> {
    // This is for the command handler - convert to WebviewWindow if needed
    // For now, we'll use the internal function directly
    Err("Use stream_translate_webview instead".to_string())
}

#[tauri::command]
async fn start_audio_recording() -> Result<(), String> {
    // Check if already recording
    if IS_RECORDING.load(Ordering::Relaxed) {
        return Err("Already recording".to_string());
    }

    let host = cpal::default_host();
    
    // Try to get system audio output device (loopback)
    let device = match find_system_audio_device(&host) {
        Some(dev) => dev,
        None => {
            println!("⚠️ No system audio device found, falling back to default input");
            host.default_input_device()
                .ok_or("No audio device available")?
        }
    };
    
    let config = device.default_input_config()
        .map_err(|e| format!("Failed to get default input config: {}", e))?;
    
    let sample_rate = config.sample_rate().0;
    let channels = config.channels();
    
    println!("🎤 Starting audio recording - Sample rate: {}, Channels: {}", sample_rate, channels);
    
    // Clear previous audio data and start recording
    if let Ok(mut audio_vec) = AUDIO_DATA.lock() {
        audio_vec.clear();
    }
    
    IS_RECORDING.store(true, Ordering::Relaxed);
    
    let audio_data_clone = AUDIO_DATA.clone();
    let is_recording_clone = IS_RECORDING.clone();
    
    let stream = match config.sample_format() {
        cpal::SampleFormat::F32 => {
            device.build_input_stream(
                &config.into(),
                move |data: &[f32], _: &cpal::InputCallbackInfo| {
                    if is_recording_clone.load(Ordering::Relaxed) {
                        if let Ok(mut audio_vec) = audio_data_clone.lock() {
                            audio_vec.extend_from_slice(data);
                        }
                    }
                },
                |err| eprintln!("Audio recording error: {}", err),
                None,
            )
        },
        _ => return Err("Unsupported sample format".to_string()),
    }.map_err(|e| format!("Failed to build input stream: {}", e))?;
    
    stream.play().map_err(|e| format!("Failed to start stream: {}", e))?;
    
    // Keep the stream alive by creating a handle that will be dropped later
    std::mem::forget(stream);
    
    Ok(())
}

#[tauri::command]
async fn stop_audio_recording() -> Result<AudioRecordingResult, String> {
    // Check if currently recording
    if !IS_RECORDING.load(Ordering::Relaxed) {
        return Err("No active recording session".to_string());
    }
    
    // Stop recording
    IS_RECORDING.store(false, Ordering::Relaxed);
    
    // Wait a moment for any remaining samples
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Get the recorded audio data
    let audio_data = AUDIO_DATA.lock()
        .map_err(|_| "Failed to acquire audio data lock")?
        .clone();
    
    println!("🎤 Audio recording stopped. Recorded {} samples", audio_data.len());
    
    Ok(AudioRecordingResult {
        success: true,
        audio_data: Some(audio_data),
        error: None,
    })
}

#[tauri::command]
async fn transcribe_audio(audio_data: Vec<f32>) -> Result<TranscriptionResult, String> {
    if audio_data.is_empty() {
        return Ok(TranscriptionResult {
            success: false,
            transcription: None,
            error: Some("No audio data provided".to_string()),
        });
    }
    
    // Read API key from environment variable
    let api_key = env::var("OPENAI_API_KEY")
        .map_err(|_| "OPENAI_API_KEY environment variable not found")?;
    
    // Convert audio to WAV format
    let wav_data = convert_audio_to_wav(&audio_data, 44100, 1)
        .map_err(|e| format!("Failed to convert audio: {}", e))?;
    
    // Create multipart form for OpenAI Whisper API
    let client = reqwest::Client::new();
    
    println!("🎙️ Converting {} audio samples to WAV format...", audio_data.len());
    println!("📁 WAV file size: {} bytes", wav_data.len());
    
    let form = reqwest::multipart::Form::new()
        .part("file", reqwest::multipart::Part::bytes(wav_data)
            .file_name("audio.wav")
            .mime_str("audio/wav").unwrap())
        .text("model", "whisper-1");
    
    println!("🚀 Sending audio to OpenAI Whisper API...");
    let duration_seconds = audio_data.len() as f32 / 44100.0;
    println!("⏱️ Audio duration: {:.1}s (estimated transcription time: 5-15s)", duration_seconds);
    
    let start_time = std::time::Instant::now();
    let response = client
        .post("https://api.openai.com/v1/audio/transcriptions")
        .header("Authorization", format!("Bearer {}", api_key))
        .multipart(form)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;
    
    let elapsed = start_time.elapsed();
    if response.status().is_success() {
        println!("✅ Received response from OpenAI Whisper API (took {:.1}s)", elapsed.as_secs_f32());
        let result: serde_json::Value = response.json().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;
        
        if let Some(text) = result["text"].as_str() {
            let trimmed_text = text.trim();
            if !trimmed_text.is_empty() {
                println!("🎉 TRANSCRIPTION SUCCESS: \"{}\"", trimmed_text);
                println!("📋 Text will be copied to clipboard!");
                Ok(TranscriptionResult {
                    success: true,
                    transcription: Some(trimmed_text.to_string()),
                    error: None,
                })
            } else {
                println!("⚠️ Whisper returned empty transcription");
                Ok(TranscriptionResult {
                    success: false,
                    transcription: None,
                    error: Some("Whisper returned empty transcription (no speech detected)".to_string()),
                })
            }
        } else {
            println!("❌ No 'text' field in Whisper response");
            Ok(TranscriptionResult {
                success: false,
                transcription: None,
                error: Some("No transcription in response".to_string()),
            })
        }
    } else {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        println!("❌ Whisper API error {}: {}", status, error_text);
        Ok(TranscriptionResult {
            success: false,
            transcription: None,
            error: Some(format!("API error {}: {}", status, error_text)),
        })
    }
}

fn find_system_audio_device(host: &cpal::Host) -> Option<cpal::Device> {
    // Try to find a system audio device for capturing computer audio
    let devices = match host.input_devices() {
        Ok(devices) => devices,
        Err(_) => return None,
    };

    for device in devices {
        if let Ok(name) = device.name() {
            let name_lower = name.to_lowercase();
            
            // Look for devices that indicate system audio capture
            // These names vary by platform and audio drivers
            if name_lower.contains("stereo mix") ||
               name_lower.contains("what u hear") ||
               name_lower.contains("loopback") ||
               name_lower.contains("monitor") ||
               name_lower.contains("soundflower") ||
               name_lower.contains("blackhole") ||
               name_lower.contains("virtual audio cable") {
                println!("🔊 Found system audio device: {}", name);
                return Some(device);
            }
        }
    }

    // On macOS, also check output devices as some can be used for loopback
    if cfg!(target_os = "macos") {
        if let Ok(output_devices) = host.output_devices() {
            for device in output_devices {
                if let Ok(name) = device.name() {
                    let name_lower = name.to_lowercase();
                    if name_lower.contains("blackhole") || 
                       name_lower.contains("soundflower") {
                        println!("🔊 Found macOS system audio device: {}", name);
                        return Some(device);
                    }
                }
            }
        }
    }

    println!("⚠️ No system audio capture device found. You may need to install virtual audio software like:");
    println!("   • macOS: BlackHole, SoundFlower");
    println!("   • Windows: VB-Audio Virtual Cable, Stereo Mix");
    println!("   • Linux: PulseAudio monitor devices");
    
    None
}

#[tauri::command]
async fn list_audio_devices() -> Result<Vec<String>, String> {
    let host = cpal::default_host();
    let mut devices = Vec::new();
    
    // List input devices
    devices.push("=== INPUT DEVICES ===".to_string());
    if let Ok(input_devices) = host.input_devices() {
        for device in input_devices {
            if let Ok(name) = device.name() {
                devices.push(format!("Input: {}", name));
            }
        }
    }
    
    // List output devices
    devices.push("=== OUTPUT DEVICES ===".to_string());
    if let Ok(output_devices) = host.output_devices() {
        for device in output_devices {
            if let Ok(name) = device.name() {
                devices.push(format!("Output: {}", name));
            }
        }
    }
    
    Ok(devices)
}

fn convert_audio_to_wav(audio_data: &[f32], sample_rate: u32, channels: u16) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let mut cursor = std::io::Cursor::new(Vec::new());
    
    {
        let spec = hound::WavSpec {
            channels,
            sample_rate,
            bits_per_sample: 32,
            sample_format: hound::SampleFormat::Float,
        };
        
        let mut writer = hound::WavWriter::new(&mut cursor, spec)?;
        
        for &sample in audio_data {
            writer.write_sample(sample)?;
        }
        
        writer.finalize()?;
    }
    
    Ok(cursor.into_inner())
}

#[tauri::command]
async fn summarize_text(text: String, api_key: String) -> Result<String, String> {
    if text.trim().is_empty() {
        return Err("No text provided to summarize".to_string());
    }

    // Read API key from environment if not provided
    let api_key = if api_key == "dummy" {
        env::var("OPENAI_API_KEY")
            .map_err(|_| "OPENAI_API_KEY environment variable not found")?
    } else {
        api_key
    };

    let client = reqwest::Client::new();
    
    // Create a concise but comprehensive summary prompt
    let system_prompt = "You are an expert text summarizer. Create a clear, concise summary that captures the key points and main ideas. Keep it informative but brief. Focus on the most important information.";
    
    let user_prompt = format!("Please summarize the following text:\n\n{}", text);
    
    let payload = serde_json::json!({
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user", 
                "content": user_prompt
            }
        ],
        "temperature": 0.3,
        "max_tokens": 500
    });

    println!("📝 Summarizing text ({} chars) with OpenAI...", text.len());
    let start_time = std::time::Instant::now();

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let elapsed = start_time.elapsed();
    
    if response.status().is_success() {
        println!("✅ Received summary from OpenAI (took {:.1}s)", elapsed.as_secs_f32());
        let result: serde_json::Value = response.json().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;
        
        if let Some(summary) = result["choices"][0]["message"]["content"].as_str() {
            let summary = summary.trim().to_string();
            println!("🎉 SUMMARY SUCCESS: \"{}\"", summary);
            println!("📋 Summary will be copied to clipboard!");
            Ok(summary)
        } else {
            Err("No summary content in response".to_string())
        }
    } else {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        println!("❌ OpenAI API error {}: {}", status, error_text);
        Err(format!("API error {}: {}", status, error_text))
    }
}

#[tauri::command]
async fn show_summarizer_window(app_handle: tauri::AppHandle, text: String) -> Result<(), String> {
    let window = tauri::WebviewWindowBuilder::new(
        &app_handle,
        "summarizer",
        tauri::WebviewUrl::App("summarizer.html".into())
    )
    .title("Text Summarizer")
    .inner_size(700.0, 500.0)
    .center()
    .resizable(true)
    .build()
    .map_err(|e| e.to_string())?;
    
    // Wait for window to load, then send events with retries
    tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
    
    println!("🪟 Sending clipboard text to summarizer window: {} chars", text.len());
    
    // Send the clipboard text multiple times to ensure it's received
    for i in 0..3 {
        match window.emit("clipboard-text", &text) {
            Ok(_) => {
                println!("✅ Successfully sent clipboard-text event (attempt {})", i + 1);
                break;
            },
            Err(e) => {
                println!("❌ Failed to send clipboard-text event (attempt {}): {}", i + 1, e);
                if i < 2 {
                    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
                }
            }
        }
    }
    
    // Start the summarization
    let _ = summarize_for_window(text, window).await;
    
    Ok(())
}

async fn summarize_for_window(text: String, window: tauri::WebviewWindow) -> Result<(), String> {
    // Read API key from environment variable
    let api_key = env::var("OPENAI_API_KEY")
        .map_err(|_| "OPENAI_API_KEY environment variable not found. Please check your .env file.".to_string())?;

    let client = reqwest::Client::new();
    
    // Create a concise but comprehensive summary prompt
    let system_prompt = "You are an expert text summarizer. Create a clear, concise summary that captures the key points and main ideas. Keep it informative but brief. Focus on the most important information.";
    
    let user_prompt = format!("Please summarize the following text:\n\n{}", text);
    
    let payload = serde_json::json!({
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user", 
                "content": user_prompt
            }
        ],
        "temperature": 0.3,
        "max_tokens": 500
    });

    println!("📝 Summarizing text ({} chars) with OpenAI for window...", text.len());
    let start_time = std::time::Instant::now();

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let elapsed = start_time.elapsed();
    
    if response.status().is_success() {
        println!("✅ Received summary from OpenAI (took {:.1}s)", elapsed.as_secs_f32());
        let result: serde_json::Value = response.json().await
            .map_err(|e| e.to_string())?;
        
        if let Some(summary) = result["choices"][0]["message"]["content"].as_str() {
            let summary = summary.trim().to_string();
            println!("🎉 SUMMARY SUCCESS for window: \"{}\"", summary);
            
            // Emit completion to the window
            let _ = window.emit("summary-complete", &summary);
        } else {
            let _ = window.emit("summary-error", "No summary content in response");
        }
    } else {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        println!("❌ OpenAI API error {}: {}", status, error_text);
        let _ = window.emit("summary-error", &format!("API error {}: {}", status, error_text));
    }
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Load environment variables from .env file
    dotenvy::dotenv().ok();
    
    // Log whether API key is loaded
    match env::var("OPENAI_API_KEY") {
        Ok(_) => println!("✅ OpenAI API key loaded from environment"),
        Err(_) => println!("❌ OpenAI API key not found. Please check your .env file."),
    }
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            translate_text, 
            get_clipboard_text, 
            show_translation_window, 
            stream_translate,
            start_audio_recording,
            stop_audio_recording,
            transcribe_audio,
            list_audio_devices,
            summarize_text,
            show_summarizer_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
