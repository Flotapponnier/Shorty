import { BaseAgent, type AgentConfig, type AgentContext, type AgentResult } from '../../types/Agent.js';
import { AudioRecordingService } from '../../services/AudioRecordingService.js';

export class AudioRecorderAgent extends BaseAgent {
  private audioService: AudioRecordingService;
  private isRecording: boolean = false;

  constructor(audioService: AudioRecordingService) {
    const config: AgentConfig = {
      name: 'Audio Recorder',
      description: 'Record system audio and convert speech to text using AI',
      shortcut: 'cmd+r',
      enabled: true
    };

    super(config);
    this.audioService = audioService;
  }

  public async execute(context: AgentContext): Promise<AgentResult> {
    console.log(`🎤 Audio recording toggle triggered. Currently recording: ${this.isRecording}`);

    try {
      if (!this.isRecording) {
        // Start recording
        await this.startRecording();
        return {
          success: true,
          output: 'Recording started...'
        };
      } else {
        // Stop recording and transcribe
        const transcription = await this.stopRecordingAndTranscribe();
        return {
          success: true,
          output: transcription
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async startRecording(): Promise<void> {
    console.log('🔴 Starting audio recording...');
    await this.audioService.startRecording();
    this.isRecording = true;
  }

  private async stopRecordingAndTranscribe(): Promise<string> {
    console.log('⏹️ Stopping recording and transcribing...');
    const audioData = await this.audioService.stopRecording();
    this.isRecording = false;

    if (!audioData || audioData.length === 0) {
      throw new Error('No audio data recorded');
    }

    console.log('🤖 Transcribing audio...');
    const transcription = await this.audioService.transcribeAudio(audioData);
    
    if (!transcription || transcription.trim().length === 0) {
      return 'No speech detected in the recorded audio. Try recording when someone is speaking or increase recording duration.';
    }

    return transcription;
  }

  public isCurrentlyRecording(): boolean {
    return this.isRecording;
  }
}