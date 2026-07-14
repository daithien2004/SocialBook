import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { IMediaService } from '@/domain/cloudinary/interfaces/media.service.interface';
import {
  ITextToSpeechProvider,
  AudioGenerationOptions,
} from '@/domain/text-to-speech/interfaces/text-to-speech.provider.interface';

@Injectable()
export class ElevenLabsProvider implements ITextToSpeechProvider {
  constructor(
    private readonly configService: ConfigService,
    private readonly mediaService: IMediaService,
  ) {}

  async generateAudio(
    text: string,
    options: AudioGenerationOptions,
  ): Promise<{ audioUrl: string; format: string; duration?: number }> {
    const { format = 'mp3' } = options;
    const apiKey = this.configService.get<string>('env.ELEVENLABS_API_KEY');

    // Use the voice from config, or a default known Voice ID (e.g. Rachel)
    const voiceId =
      this.configService.get<string>('env.ELEVENLABS_VOICE_ID') ||
      'BYtZrKUsiaR2iHNpf2uV';

    const modelId =
      this.configService.get<string>('env.ELEVENLABS_MODEL_ID') || 'eleven_v3';

    if (!apiKey) {
      throw new InternalServerErrorException(
        'ElevenLabs API key not found in configuration',
      );
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`ElevenLabs API error: ${err}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length < 100) {
        throw new Error('ElevenLabs returned invalid audio data');
      }

      const fakeAudioFile: Express.Multer.File = {
        buffer,
        originalname: `tts-${Date.now()}.${format}`,
        mimetype: `audio/${format === 'mp3' ? 'mpeg' : format}`,
        fieldname: 'audio',
        encoding: '7bit',
        size: buffer.length,
        destination: '',
        filename: `tts-${Date.now()}.${format}`,
        path: '',
        stream: Readable.from(buffer),
      };

      const audioUrl = await this.mediaService.uploadAudio(fakeAudioFile);

      return { audioUrl, format, duration: 0 };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `Failed to generate audio via ElevenLabs: ${message}`,
      );
    }
  }
}
