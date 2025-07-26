use serde::{Deserialize, Serialize};
use tauri::Emitter;
use std::env;

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
        .invoke_handler(tauri::generate_handler![translate_text, get_clipboard_text, show_translation_window, stream_translate])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
