import { FeatureSection, type FeatureSectionData } from './FeatureSection/FeatureSection.js';
import { MonitorPage } from './MonitorPage/MonitorPage.js';
import { AgentManager } from '../services/AgentManager.js';
import { ShortcutManager } from '../services/ShortcutManager.js';
import { TranslationService } from '../services/TranslationService.js';
import { AudioRecordingService } from '../services/AudioRecordingService.js';
import { TranslatorAgent } from '../agents/translator/TranslatorAgent.js';
import { AudioRecorderAgent } from '../agents/audio-recorder/AudioRecorderAgent.js';

export class App {
  private container: HTMLElement;
  private featuresContainer!: HTMLElement;
  private featureSections: FeatureSection[] = [];
  private agentManager: AgentManager;
  private shortcutManager: ShortcutManager;
  private monitorPage: MonitorPage;
  private currentView: 'features' | 'monitor' = 'features';

  constructor() {
    this.container = document.querySelector('main.container') as HTMLElement;
    this.agentManager = new AgentManager();
    this.shortcutManager = new ShortcutManager(this.agentManager);
    this.monitorPage = new MonitorPage(this.agentManager);
    this.init();
  }

  private async init(): Promise<void> {
    this.createNavigation();
    this.createFeaturesContainer();
    this.renderFeatures();
    this.setupMonitorPage();
    await this.initializeAgents();
  }

  private createNavigation(): void {
    const nav = document.createElement('nav');
    nav.className = 'app-navigation';
    nav.innerHTML = `
      <button class="nav-btn active" data-view="features">Features</button>
      <button class="nav-btn" data-view="monitor">Monitor</button>
      <div class="status-section">
        <span class="status-text">OpenAI API integrated</span>
      </div>
    `;

    nav.addEventListener('click', (e) => {
      if (e.target instanceof HTMLButtonElement && e.target.classList.contains('nav-btn')) {
        const view = e.target.dataset.view as 'features' | 'monitor';
        this.switchView(view);
      }
    });

    this.container.insertBefore(nav, this.container.firstChild);
  }

  private createFeaturesContainer(): void {
    this.featuresContainer = document.createElement('div');
    this.featuresContainer.className = 'features-container';
    this.container.appendChild(this.featuresContainer);
  }

  private setupMonitorPage(): void {
    this.container.appendChild(this.monitorPage.getElement());
  }

  private renderFeatures(): void {
    const features: FeatureSectionData[] = [
      {
        title: 'LLM',
        description: 'Use cmd+k shortcut to take a screen call an agent and predefine a question with configuring your own button prompt and call the agent to answer your question about it',
        shortcut: 'cmd+k'
      },
      {
        title: 'Translate Clipboard/Text Selection',
        description: 'Translate clipboard or selected text to a preferred language using LLM translation agent.',
        shortcut: 'cmd+t'
      },
      {
        title: 'System Audio Recorder',
        description: 'Record computer audio (videos, music, meetings) and convert speech to text using AI. Press cmd+r to start recording, press again to stop and get transcription.',
        shortcut: 'cmd+r'
      }
    ];

    features.forEach(featureData => {
      const featureSection = new FeatureSection(featureData, this.featuresContainer);
      this.featureSections.push(featureSection);
    });
  }

  private async initializeAgents(): Promise<void> {
    try {
      console.log('🚀 Initializing agents...');
      
      // Debug: List available audio devices
      await this.debugAudioDevices();
      
      // Initialize translation service with dummy key (handled in backend)
      const translationService = new TranslationService('dummy-key', 'English');
      
      // Initialize audio recording service
      const audioRecordingService = new AudioRecordingService();
      
      // Create and register translator agent
      const translatorAgent = new TranslatorAgent(translationService);
      console.log(`📝 Created translator agent with shortcut: ${translatorAgent.getShortcut()}`);
      
      // Create and register audio recorder agent
      const audioRecorderAgent = new AudioRecorderAgent(audioRecordingService);
      console.log(`🎤 Created audio recorder agent with shortcut: ${audioRecorderAgent.getShortcut()}`);
      
      this.agentManager.registerAgent(translatorAgent);
      this.agentManager.registerAgent(audioRecorderAgent);
      console.log('📋 Registered all agents in manager');

      // Register global shortcuts
      console.log('⌨️ Registering global shortcuts...');
      await this.shortcutManager.registerAgentShortcuts();

      console.log('✅ Agents initialized successfully with OpenAI backend');
    } catch (error) {
      console.error('❌ Failed to initialize agents:', error);
      alert('Failed to initialize shortcuts. Check console for errors.');
    }
  }

  private switchView(view: 'features' | 'monitor'): void {
    const navBtns = this.container.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    const activeBtn = this.container.querySelector(`[data-view="${view}"]`);
    activeBtn?.classList.add('active');

    if (view === 'features') {
      this.featuresContainer.style.display = 'flex';
      this.monitorPage.hide();
    } else {
      this.featuresContainer.style.display = 'none';
      this.monitorPage.show();
    }

    this.currentView = view;
  }

  private async debugAudioDevices(): Promise<void> {
    try {
      const audioService = new AudioRecordingService();
      const devices = await audioService.listAudioDevices();
      console.log('🎧 Available Audio Devices:');
      devices.forEach(device => console.log(`  - ${device}`));
    } catch (error) {
      console.error('❌ Failed to list audio devices:', error);
    }
  }

  public addFeature(featureData: FeatureSectionData): void {
    const featureSection = new FeatureSection(featureData, this.featuresContainer);
    this.featureSections.push(featureSection);
  }


  public destroy(): void {
    this.featureSections.forEach(section => section.destroy());
    this.featureSections = [];
    this.shortcutManager.unregisterAllShortcuts();
    this.featuresContainer.remove();
  }
}