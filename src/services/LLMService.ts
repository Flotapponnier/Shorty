export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export class LLMService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.groq.com/openai/v1', model: string = 'llama3-8b-8192') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
  }

  public async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        return {
          success: false,
          error: 'No response from LLM'
        };
      }

      return {
        success: true,
        content: data.choices[0].message.content
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  public async translate(text: string, targetLanguage: string = 'English'): Promise<LLMResponse> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `You are a professional translator. Translate the given text to ${targetLanguage}. Only respond with the translation, no explanations or additional text.`
      },
      {
        role: 'user',
        content: text
      }
    ];

    return this.chat(messages);
  }

  public async analyze(text: string, prompt: string): Promise<LLMResponse> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant that analyzes content based on user requests.'
      },
      {
        role: 'user',
        content: `${prompt}\n\nContent to analyze:\n${text}`
      }
    ];

    return this.chat(messages);
  }
}