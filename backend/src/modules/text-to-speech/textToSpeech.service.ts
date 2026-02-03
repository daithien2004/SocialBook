import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TextToSpeechDto } from './dto/textToSpeech.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  TextToSpeech,
  TextToSpeechDocument,
  TTSStatus,
} from './schemas/textToSpeech.schema';
import { ErrorMessages } from '@/src/common/constants/error-messages';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ChaptersService } from '../chapters/chapters.service';

interface GenerateAudioOptions {
  voice?: string;
  speed?: number;
  pitch?: number;
  language?: string;
  format?: string;
  forceRegenerate?: boolean;
}

@Injectable()
export class TextToSpeechService {
  constructor(
    @InjectModel(TextToSpeech.name)
    private readonly ttsModel: Model<TextToSpeechDocument>,
    private cloudinaryService: CloudinaryService,
    private configService: ConfigService,
    @Inject(forwardRef(() => ChaptersService))
    private chaptersService: ChaptersService,
  ) { }

  /**
   * Detect language from text content based on Vietnamese diacritics
   */
  private detectLanguage(text: string): {
    code: string;
    voice: string;
    name: string;
  } {
    // Vietnamese specific characters with diacritics
    const vietnamesePattern =
      /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

    // Check for any Vietnamese diacritic characters
    const hasVietnamese = vietnamesePattern.test(text);

    if (hasVietnamese) {
      console.log(`🇻🇳 Detected Vietnamese (diacritics present)`);
      // Try different voice codes - VoiceRSS may be case-sensitive or require specific format
      return {
        code: 'vi-VN',
        voice: 'vi-VN', // Changed from 'vi-vn' to 'vi-VN' (capitalized)
        name: 'Vietnamese',
      };
    }

    console.log(`🇺🇸 Detected English (no Vietnamese diacritics)`);
    return {
      code: 'en-US',
      voice: 'en-US', // Also capitalize for consistency
      name: 'English',
    };
  }

  /**
   * Generate audio for a single chapter
   */
  async generateAudioForChapter(
    chapterId: string,
    options: GenerateAudioOptions = {},
  ): Promise<Record<string, unknown>> {
    // Validation
    if (!Types.ObjectId.isValid(chapterId)) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    // Get chapter with full paragraphs first to analyze content
    const chapter = await this.chaptersService.findById(chapterId);
    if (!chapter) {
      throw new NotFoundException(ErrorMessages.CHAPTER_NOT_FOUND);
    }

    // Combine paragraphs into single text
    const text = (chapter.paragraphs as any[]).map((p) => p.content).join('\n\n');

    // Auto-detect language if not provided
    const detected = this.detectLanguage(text);

    const {
      voice = detected.voice,
      speed = 1.0,
      language = detected.code,
      format = 'mp3',
      forceRegenerate = false,
    } = options;

    console.log(
      `📝 Generating audio with: language=${language}, voice=${voice}`,
    );

    // Check if TTS already exists (caching)
    if (!forceRegenerate) {
      const existingTTS = await this.ttsModel
        .findOne({
          chapterId: new Types.ObjectId(chapterId),
          status: TTSStatus.COMPLETED,
          language,
          voice,
        })
        .lean();

      if (existingTTS) {
        return {
          id: existingTTS._id.toString(),
          chapterId: existingTTS.chapterId.toString(),
          bookId: existingTTS.bookId.toString(),
          audioUrl: existingTTS.audioUrl,
          status: existingTTS.status,
          audioDuration: existingTTS.audioDuration,
          audioFormat: existingTTS.audioFormat,
          language: existingTTS.language,
          voice: existingTTS.voice,
          createdAt: existingTTS.createdAt,
          message: 'Using existing audio (cached)',
        };
      }
    }

    const characterCount = text.length;
    const paragraphCount = chapter.paragraphs.length;

    if (!text.trim()) {
      throw new BadRequestException(
        'Chapter has no content to generate audio from',
      );
    }

    // Get bookId safely from ChapterModal
    const bookId = chapter.bookId;

    if (!bookId) {
      console.error('Cannot get bookId from chapter:', { chapter });
      throw new BadRequestException(ErrorMessages.CHAPTER_MISSING_BOOK);
    }

    console.log(
      `📚 Creating TTS record for chapter ${chapterId}, book ${bookId}`,
    );

    // Create pending record
    const ttsRecord = await this.ttsModel.create({
      chapterId: new Types.ObjectId(chapterId),
      bookId: new Types.ObjectId(bookId),
      text,
      paragraphCount,
      characterCount,
      voice,
      speed,
      language,
      status: TTSStatus.PENDING,
    });

    try {
      // Update status to processing
      await this.ttsModel.updateOne(
        { _id: ttsRecord._id },
        { status: TTSStatus.PROCESSING },
      );

      // Generate audio using Voice RSS
      const audioUrl = await this.generateWithVoiceRSS(text, {
        voice,
        format,
      });

      // Update record with success
      const updatedRecord = await this.ttsModel
        .findByIdAndUpdate(
          ttsRecord._id,
          {
            audioUrl,
            audioFormat: format,
            status: TTSStatus.COMPLETED,
            processedAt: new Date(),
            provider: 'voicerss',
          },
          { new: true },
        )
        .lean();

      if (!updatedRecord) {
        throw new InternalServerErrorException(ErrorMessages.TTS_UPDATE_FAILED);
      }

      return {
        id: updatedRecord._id.toString(),
        chapterId: updatedRecord.chapterId.toString(),
        bookId: updatedRecord.bookId.toString(),
        audioUrl: updatedRecord.audioUrl,
        status: updatedRecord.status,
        audioDuration: updatedRecord.audioDuration,
        audioFormat: updatedRecord.audioFormat,
        language: updatedRecord.language,
        voice: updatedRecord.voice,
        characterCount: updatedRecord.characterCount,
        paragraphCount: updatedRecord.paragraphCount,
        createdAt: updatedRecord.createdAt,
        processedAt: updatedRecord.processedAt,
      };
    } catch (error) {
      // Update record with failure
      await this.ttsModel.updateOne(
        { _id: ttsRecord._id },
        {
          status: TTSStatus.FAILED,
          errorMessage: error.message || 'Unknown error',
          errorDetails: error,
        },
      );

      throw new InternalServerErrorException(
        `Failed to generate audio: ${error.message}`,
      );
    }
  }

  /**
   * Generate audio for all chapters in a book
   */
  async generateAudioForAllChapters(
    bookId: string,
    options: GenerateAudioOptions = {},
  ): Promise<Record<string, unknown>> {
    if (!Types.ObjectId.isValid(bookId)) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    // Get all chapters for the book
    const chapters = await this.chaptersService
      .findByBookSlug(bookId)
      .catch(async () => {
        // If getChaptersByBookSlug fails (expects slug), try finding by ID
        const chapterModel = this.ttsModel.db.model('Chapter');
        const chaptersList = await chapterModel
          .find({ bookId: new Types.ObjectId(bookId) })
          .select('_id title orderIndex')
          .sort({ orderIndex: 1 })
          .lean();

        return { chapters: chaptersList.map((c: any) => ({ id: c._id.toString() })) } as any;
      });

    if (!chapters.chapters || chapters.chapters.length === 0) {
      throw new NotFoundException(ErrorMessages.NO_CHAPTERS_FOUND);
    }

    const results = {
      total: chapters.chapters.length,
      successful: 0,
      failed: 0,
      errors: [] as Record<string, unknown>[],
      generated: [] as Record<string, unknown>[],
    };

    // Generate audio for each chapter
    for (const chapter of (chapters.chapters as any[])) {
      try {
        const result = await this.generateAudioForChapter(chapter.id, options);
        results.successful++;
        results.generated.push({
          chapterId: chapter.id,
          status: 'success',
          audioUrl: result.audioUrl,
        });
      } catch (error) {
        results.failed++;
        results.errors.push({
          chapterId: chapter.id,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Get TTS by chapter ID
   */
  async getAudioByChapterId(chapterId: string): Promise<Record<string, unknown> | null> {
    if (!Types.ObjectId.isValid(chapterId)) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    const tts = await this.ttsModel
      .findOne({
        chapterId: new Types.ObjectId(chapterId),
        status: TTSStatus.COMPLETED,
      })
      .sort({ createdAt: -1 })
      .lean();

    if (!tts) {
      return null;
    }

    return {
      id: tts._id.toString(),
      chapterId: tts.chapterId.toString(),
      bookId: tts.bookId.toString(),
      audioUrl: tts.audioUrl,
      status: tts.status,
      audioDuration: tts.audioDuration,
      audioFormat: tts.audioFormat,
      language: tts.language,
      voice: tts.voice,
      characterCount: tts.characterCount,
      paragraphCount: tts.paragraphCount,
      playCount: tts.playCount,
      lastPlayedAt: tts.lastPlayedAt,
      createdAt: tts.createdAt,
    };
  }

  /**
   * Delete TTS audio
   */
  async deleteAudio(chapterId: string): Promise<Record<string, unknown>> {
    if (!Types.ObjectId.isValid(chapterId)) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    const result = await this.ttsModel.deleteMany({
      chapterId: new Types.ObjectId(chapterId),
    });

    return {
      success: true,
      deletedCount: result.deletedCount,
    };
  }

  /**
   * Increment play count
   */
  async incrementPlayCount(chapterId: string): Promise<void> {
    await this.ttsModel.updateOne(
      {
        chapterId: new Types.ObjectId(chapterId),
        status: TTSStatus.COMPLETED,
      },
      {
        $inc: { playCount: 1 },
        $set: { lastPlayedAt: new Date() },
      },
    );
  }

  /**
   * Legacy method - generate audio from text (kept for backwards compatibility)
   */
  async generate(dto: TextToSpeechDto): Promise<string> {
    const { text, voice = 'vi-vn', format = 'mp3' } = dto;

    return await this.generateWithVoiceRSS(text, { voice, format });
  }

  /**
   * Private method to call Voice RSS API
   */
  private async generateWithVoiceRSS(
    text: string,
    options: { voice: string; format: string },
  ): Promise<string> {
    const { voice, format } = options;
    const apiKey = this.configService.get<string>('env.VOICERSS_API_KEY');

    if (!apiKey) {
      throw new InternalServerErrorException(ErrorMessages.TTS_API_KEY_NOT_FOUND);
    }

    // VoiceRSS URL (base only)
    const url = 'https://api.voicerss.org/';

    console.log(`🎤 VoiceRSS API Call (POST):`, {
      voice,
      format,
      textLength: text.length,
      textPreview: text.substring(0, 100) + '...',
    });

    // Prepare form data
    const formData = new URLSearchParams();
    formData.append('key', apiKey);
    formData.append('src', text);
    formData.append('hl', voice);
    formData.append('c', format);
    formData.append('f', '44khz_16bit_stereo');

    // Call VoiceRSS API via POST
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log(`📡 VoiceRSS Response:`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`❌ VoiceRSS Error Response:`, err);
      throw new InternalServerErrorException(
        `VoiceRSS error (${voice}): ${err}`,
      );
    }

    // Validate Content-Type
    const contentType = response.headers.get('content-type');
    if (contentType && (contentType.includes('text/html') || contentType.includes('application/json') || contentType.includes('text/plain'))) {
      const errText = await response.text();
      console.error(`❌ VoiceRSS returned non-audio response (${contentType}):`, errText);
      throw new InternalServerErrorException(`VoiceRSS API returned error: ${errText.substring(0, 200)}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate buffer size (audio file should be larger than 100 bytes)
    if (buffer.length < 100) {
      const errText = buffer.toString('utf-8');
      console.error(`❌ VoiceRSS returned too small buffer (${buffer.length} bytes):`, errText);
      // Check if it's a text error message disguised as a small file
      if (errText.includes('ERROR:')) {
        throw new InternalServerErrorException(`VoiceRSS Error: ${errText}`);
      }
      throw new InternalServerErrorException(`VoiceRSS API returned invalid audio data (too small)`);
    }

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

    return audioUrl;
  }
}
