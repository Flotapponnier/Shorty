import { BaseAgent, type AgentConfig, type AgentContext, type AgentResult } from '../../types/Agent.js';
import { TranslationService } from '../../services/TranslationService.js';

export class TranslatorAgent extends BaseAgent {
  private translationService: TranslationService;

  constructor(translationService: TranslationService) {
    const config: AgentConfig = {
      name: 'Translator',
      description: 'Translate clipboard or selected text to a preferred language',
      shortcut: 'cmd+t',
      enabled: true
    };

    super(config);
    this.translationService = translationService;
  }

  public async execute(context: AgentContext): Promise<AgentResult> {
    const { input, metadata } = context;

    if (!input || input.trim().length === 0) {
      return {
        success: false,
        error: 'No text provided for translation'
      };
    }

    const targetLanguage = metadata?.targetLanguage;

    console.log(`Translating text to ${targetLanguage || 'default language'}:`, input.substring(0, 100) + '...');

    const result = await this.translationService.translate(input, targetLanguage);

    if (!result.success) {
      return {
        success: false,
        error: `Translation failed: ${result.error}`
      };
    }

    return {
      success: true,
      output: result.translated_text
    };
  }
}