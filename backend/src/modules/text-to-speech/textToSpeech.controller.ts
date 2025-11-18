import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { TextToSpeechService } from './textToSpeech.service';
import { TextToSpeechDto } from './dto/textToSpeech.dto';
import { Public } from '@/src/common/decorators/customize';

@Controller('text-to-speech')
export class TextToSpeechController {
  constructor(private readonly ttsService: TextToSpeechService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  async generateSpeech(@Body() dto: TextToSpeechDto) {
    const audioUrl = await this.ttsService.generate(dto);

    return {
      message: 'Generated speech successfully',
      data: audioUrl,
    };
  }
}
