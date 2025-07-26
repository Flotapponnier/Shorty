import { invoke } from '@tauri-apps/api/core';

export interface TranslationRequest {
  text: string;
  target_language: string;
  api_key: string;
}

export interface TranslationResponse {
  success: boolean;
  translated_text?: string;
  error?: string;
}

export class TranslationService {
  private apiKey: string;
  private defaultTargetLanguage: string;

  constructor(apiKey: string, defaultTargetLanguage: string = 'English') {
    this.apiKey = apiKey;
    this.defaultTargetLanguage = defaultTargetLanguage;
  }

  public async translate(text: string, targetLanguage?: string): Promise<TranslationResponse> {
    const request: TranslationRequest = {
      text,
      target_language: targetLanguage || this.defaultTargetLanguage,
      api_key: this.apiKey
    };

    try {
      const response = await invoke<TranslationResponse>('translate_text', { request });
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  public setDefaultTargetLanguage(language: string): void {
    this.defaultTargetLanguage = language;
  }

  public getDefaultTargetLanguage(): string {
    return this.defaultTargetLanguage;
  }
}