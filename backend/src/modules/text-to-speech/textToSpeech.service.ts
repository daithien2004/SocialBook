import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { TextToSpeechDto } from './dto/textToSpeech.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TextToSpeech,
  TextToSpeechDocument,
} from './schemas/textToSpeech.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class TextToSpeechService {
  constructor(
    @InjectModel(TextToSpeech.name)
    private readonly ttsModel: Model<TextToSpeechDocument>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async generate(dto: TextToSpeechDto): Promise<string> {
    const { text, voice = 'vi-vn', format = 'mp3' } = dto;

    const apiKey = process.env.VOICERSS_API_KEY;

    if (!apiKey) {
      throw new InternalServerErrorException('VoiceRSS API key not found');
    }

    // VoiceRSS URL
    const url = `https://api.voicerss.org/?key=${apiKey}&src=${encodeURIComponent(
      text,
    )}&hl=${voice}&c=${format}&f=44khz_16bit_stereo`;

    // Gọi VoiceRSS API
    const response = await fetch(url);

    if (!response.ok) {
      const err = await response.text();
      throw new InternalServerErrorException(`VoiceRSS error: ${err}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fakeAudioFile: Express.Multer.File = {
      buffer,
      originalname: `tts-${Date.now()}.${format}`,
      mimetype: `audio/${format}`,
      fieldname: 'audio',
      encoding: '7bit',
      size: buffer.length,
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    const audioUrl = await this.cloudinaryService.uploadAudio(fakeAudioFile);

    // Lưu DB
    await this.ttsModel.create({
      text,
      voice,
      audioUrl,
    });

    return audioUrl;
  }
}
