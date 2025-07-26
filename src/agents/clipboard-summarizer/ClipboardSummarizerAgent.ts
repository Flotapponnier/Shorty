import { BaseAgent, type AgentConfig, type AgentContext, type AgentResult } from '../../types/Agent.js';

export class ClipboardSummarizerAgent extends BaseAgent {
  private apiKey: string;

  constructor(apiKey: string = 'dummy') {
    const config: AgentConfig = {
      name: 'Clipboard Summarizer',
      description: 'Summarize clipboard text content using AI',
      shortcut: 'cmd+s',
      enabled: true
    };

    super(config);
    this.apiKey = apiKey;
  }

  public async execute(context: AgentContext): Promise<AgentResult> {
    const { input } = context;

    if (!input || input.trim().length === 0) {
      return {
        success: false,
        error: 'No text found in clipboard to summarize'
      };
    }

    try {
      console.log(`📝 Summarizing clipboard text (${input.length} characters)...`);
      
      const summary = await this.summarizeText(input);
      
      return {
        success: true,
        output: summary
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async summarizeText(text: string): Promise<string> {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      
      const result = await invoke('summarize_text', {
        text: text,
        apiKey: this.apiKey
      });

      return result as string;
    } catch (error) {
      throw new Error(`Failed to summarize text: ${error}`);
    }
  }

  public updateApiKey(newApiKey: string): void {
    this.apiKey = newApiKey;
  }
}