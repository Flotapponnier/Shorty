import { register, unregister } from '@tauri-apps/plugin-global-shortcut';
import { AgentManager } from './AgentManager.js';
import { readText } from '@tauri-apps/plugin-clipboard-manager';
import { invoke } from '@tauri-apps/api/core';

export class ShortcutManager {
  private agentManager: AgentManager;
  private registeredShortcuts: Set<string> = new Set();
  private lastShortcutTime: Map<string, number> = new Map();
  private readonly DEBOUNCE_MS = 1000; // Prevent rapid shortcuts within 1 second

  constructor(agentManager: AgentManager) {
    this.agentManager = agentManager;
  }

  private getSelectedLanguage(): string {
    return localStorage.getItem('selected-language') || 'German';
  }

  public async registerAgentShortcuts(): Promise<void> {
    const agents = this.agentManager.getAllAgents();
    
    for (const agent of agents) {
      if (agent.isEnabled()) {
        await this.registerShortcut(agent.getShortcut(), agent.getName());
      }
    }
  }

  public async registerShortcut(shortcut: string, agentName: string): Promise<void> {
    try {
      console.log(`Attempting to register shortcut: ${shortcut} for ${agentName}`);
      
      await register(shortcut, async () => {
        console.log(`🔥 Shortcut ${shortcut} activated for agent: ${agentName}`);
        await this.handleShortcut(shortcut);
      });
      
      this.registeredShortcuts.add(shortcut);
      console.log(`✅ Successfully registered global shortcut: ${shortcut} for ${agentName}`);
    } catch (error) {
      console.error(`❌ Failed to register shortcut ${shortcut}:`, error);
      throw error;
    }
  }

  public async unregisterShortcut(shortcut: string): Promise<void> {
    try {
      await unregister(shortcut);
      this.registeredShortcuts.delete(shortcut);
      console.log(`Unregistered global shortcut: ${shortcut}`);
    } catch (error) {
      console.error(`Failed to unregister shortcut ${shortcut}:`, error);
    }
  }

  public async unregisterAllShortcuts(): Promise<void> {
    for (const shortcut of this.registeredShortcuts) {
      await this.unregisterShortcut(shortcut);
    }
  }

  private async handleShortcut(shortcut: string): Promise<void> {
    try {
      // Debounce rapid shortcut presses
      const now = Date.now();
      const lastTime = this.lastShortcutTime.get(shortcut) || 0;
      
      if (now - lastTime < this.DEBOUNCE_MS) {
        console.log(`⏸️ Shortcut ${shortcut} debounced (too rapid)`);
        return;
      }
      
      this.lastShortcutTime.set(shortcut, now);
      
      // For audio recording shortcut, handle separately (no clipboard needed)
      if (shortcut === 'cmd+r') {
        try {
          // Execute the audio recorder agent
          const result = await this.agentManager.executeAgent(shortcut, {
            input: 'audio_recording_toggle',
            metadata: { source: 'audio_shortcut' }
          });

          if (result.success && result.output) {
            // Copy transcription to clipboard if it's actual text
            if (result.output !== 'Recording started...') {
              console.log('📋 Copying transcription to clipboard:', result.output);
              await this.copyToClipboard(result.output);
              console.log('✅ Transcription successfully copied to clipboard!');
              this.showNotification('🎤 Recording stopped. Transcription copied to clipboard!', 'success');
            } else {
              this.showNotification('🎤 Recording started. Press cmd+r again to stop.', 'info');
            }
          } else {
            console.error('Audio recording failed:', result.error);
            this.showNotification(`Error: ${result.error}`, 'error');
          }
        } catch (error) {
          console.error('Failed to handle audio recording:', error);
          this.showNotification('Failed to handle audio recording', 'error');
        }
        return;
      }

      // For other shortcuts, get clipboard content
      const clipboardText = await readText();
      
      if (!clipboardText || clipboardText.trim().length === 0) {
        console.log('No text in clipboard for shortcut:', shortcut);
        this.showNotification('No text in clipboard', 'error');
        return;
      }

      console.log(`Processing clipboard text for ${shortcut}:`, clipboardText.substring(0, 100) + '...');

      // For translation shortcut, open the translation window
      if (shortcut === 'cmd+t') {
        try {
          const selectedLanguage = this.getSelectedLanguage();
          console.log(`🌍 Using selected language for translation: ${selectedLanguage}`);
          
          // Open translation window (the window will handle the translation)
          await invoke('show_translation_window', {
            text: clipboardText,
            targetLanguage: selectedLanguage
          });
        } catch (error) {
          console.error('Failed to open translation window:', error);
          this.showNotification('Failed to open translation window', 'error');
        }
        return;
      }

      // For summarizer shortcut, open the summarizer window
      if (shortcut === 'cmd+s') {
        try {
          console.log(`📝 Opening summarizer window for text (${clipboardText.length} chars)...`);
          
          // Open summarizer window (the window will handle the summarization)
          await invoke('show_summarizer_window', {
            text: clipboardText
          });
        } catch (error) {
          console.error('Failed to open summarizer window:', error);
          this.showNotification('Failed to open summarizer window', 'error');
        }
        return;
      }

      // For other shortcuts, use the original agent system
      const result = await this.agentManager.executeAgent(shortcut, {
        input: clipboardText,
        metadata: { source: 'clipboard' }
      });

      if (result.success && result.output) {
        // Copy result back to clipboard
        await this.copyToClipboard(result.output);
        this.showNotification('Processing completed and copied to clipboard!', 'success');
      } else {
        console.error('Agent execution failed:', result.error);
        this.showNotification(`Error: ${result.error}`, 'error');
      }

    } catch (error) {
      console.error(`Error handling shortcut ${shortcut}:`, error);
      this.showNotification(`Error: ${error}`, 'error');
    }
  }

  private async copyToClipboard(text: string): Promise<void> {
    try {
      // Use Tauri's clipboard plugin instead of navigator.clipboard
      const { writeText } = await import('@tauri-apps/plugin-clipboard-manager');
      await writeText(text);
      console.log('✅ Text copied to clipboard successfully');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback to navigator.clipboard if Tauri plugin fails
      try {
        await navigator.clipboard.writeText(text);
        console.log('✅ Text copied to clipboard via fallback');
      } catch (fallbackError) {
        console.error('Both clipboard methods failed:', fallbackError);
      }
    }
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    // Create a simple notification system
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      max-width: 300px;
      word-wrap: break-word;
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  public getRegisteredShortcuts(): string[] {
    return Array.from(this.registeredShortcuts);
  }
}