import { invoke } from '@tauri-apps/api/core';

export interface AudioRecordingResult {
  success: boolean;
  audio_data?: number[];
  error?: string;
}

export interface TranscriptionResult {
  success: boolean;
  transcription?: string;
  error?: string;
}

export class AudioRecordingService {
  private isRecording: boolean = false;

  public async startRecording(): Promise<void> {
    if (this.isRecording) {
      throw new Error('Already recording');
    }

    try {
      await invoke('start_audio_recording');
      this.isRecording = true;
      console.log('✅ Audio recording started');
    } catch (error) {
      throw new Error(`Failed to start recording: ${error}`);
    }
  }

  public async stopRecording(): Promise<number[]> {
    if (!this.isRecording) {
      throw new Error('Not currently recording');
    }

    try {
      const result = await invoke<AudioRecordingResult>('stop_audio_recording');
      this.isRecording = false;

      if (!result.success) {
        throw new Error(result.error || 'Failed to stop recording');
      }

      console.log(`✅ Audio recording stopped. Data length: ${result.audio_data?.length || 0}`);
      return result.audio_data || [];
    } catch (error) {
      this.isRecording = false;
      throw new Error(`Failed to stop recording: ${error}`);
    }
  }

  public async transcribeAudio(audioData: number[]): Promise<string> {
    if (!audioData || audioData.length === 0) {
      throw new Error('No audio data to transcribe');
    }

    try {
      console.log('🤖 Sending audio to OpenAI Whisper...');
      const result = await invoke<TranscriptionResult>('transcribe_audio', { 
        audioData 
      });

      if (!result.success) {
        throw new Error(result.error || 'Transcription failed');
      }

      console.log('✅ Transcription completed');
      return result.transcription || '';
    } catch (error) {
      throw new Error(`Transcription failed: ${error}`);
    }
  }

  public isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  public async listAudioDevices(): Promise<string[]> {
    try {
      const devices = await invoke<string[]>('list_audio_devices');
      console.log('Available audio devices:', devices);
      return devices;
    } catch (error) {
      throw new Error(`Failed to list audio devices: ${error}`);
    }
  }
}