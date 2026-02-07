import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IMediaService } from '@/src/modules/cloudinary/domain/interfaces/media.service.interface';
import { ITextToSpeechProvider, AudioGenerationOptions } from '../../domain/interfaces/text-to-speech.provider.interface';

@Injectable()
export class VoiceRSSProvider implements ITextToSpeechProvider {
    constructor(
        private readonly configService: ConfigService,
        private readonly mediaService: IMediaService
    ) {}

    async generateAudio(text: string, options: AudioGenerationOptions): Promise<{ audioUrl: string; format: string; duration?: number }> {
        const { voice, language, speed, format = 'mp3' } = options;
        const apiKey = this.configService.get<string>('env.VOICERSS_API_KEY');

        if (!apiKey) {
            throw new InternalServerErrorException('VoiceRSS API key not found');
        }

        const url = 'https://api.voicerss.org/';
        const formData = new URLSearchParams();
        formData.append('key', apiKey);
        formData.append('src', text);
        formData.append('hl', voice); // VoiceRSS uses 'hl' for language/voice
        formData.append('c', format);
        formData.append('f', '44khz_16bit_stereo');
        if (speed) formData.append('r', speed.toString());

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`VoiceRSS error: ${err}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            if (buffer.length < 100) {
                 const errText = buffer.toString('utf-8');
                 if (errText.includes('ERROR:')) {
                     throw new Error(`VoiceRSS Error: ${errText}`);
                 }
                 throw new Error('VoiceRSS returned invalid audio data');
            }

            const fakeAudioFile: any = {
                buffer,
                originalname: `tts-${Date.now()}.${format}`,
                mimetype: `audio/${format}`,
                fieldname: 'audio',
                encoding: '7bit',
                size: buffer.length,
            };

            const audioUrl = await this.mediaService.uploadAudio(fakeAudioFile);

            return { audioUrl, format, duration: 0 }; // Duration estimation might require metadata parsing (e.g. music-metadata)
        } catch (error) {
            throw new InternalServerErrorException(`Failed to generate audio: ${error.message}`);
        }
    }
}
