import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ITextToSpeechRepository } from '@/domain/text-to-speech/repositories/text-to-speech.repository.interface';
import {
  TextToSpeech as TextToSpeechEntity,
  TTSStatus,
} from '@/domain/text-to-speech/entities/text-to-speech.entity';
import {
  TextToSpeech,
  TextToSpeechDocument,
} from '../../schemas/text-to-speech.schema';

@Injectable()
export class TextToSpeechRepository implements ITextToSpeechRepository {
  constructor(
    @InjectModel(TextToSpeech.name)
    private readonly ttsModel: Model<TextToSpeechDocument>,
  ) {}

  async findById(id: string): Promise<TextToSpeechEntity | null> {
    const doc = await this.ttsModel.findById(id).lean().exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByChapterId(chapterId: string): Promise<TextToSpeechEntity | null> {
    const doc = await this.ttsModel
      .findOne({ chapterId: new Types.ObjectId(chapterId) })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async findCompletedByChapterId(
    chapterId: string,
  ): Promise<TextToSpeechEntity | null> {
    const doc = await this.ttsModel
      .findOne({
        chapterId: new Types.ObjectId(chapterId),
        status: TTSStatus.COMPLETED,
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async findExisting(
    chapterId: string,
    language: string,
    voice: string,
  ): Promise<TextToSpeechEntity | null> {
    const doc = await this.ttsModel
      .findOne({
        chapterId: new Types.ObjectId(chapterId),
        status: TTSStatus.COMPLETED,
        language,
        voice,
      })
      .lean()
      .exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async findAllByBookId(bookId: string): Promise<TextToSpeechEntity[]> {
    const docs = await this.ttsModel
      .find({ bookId: new Types.ObjectId(bookId) })
      .lean()
      .exec();
    return docs.map((doc) => this.mapToEntity(doc));
  }

  async save(tts: TextToSpeechEntity): Promise<TextToSpeechEntity> {
    const persistenceModel = this.mapToPersistence(tts);
    if (tts.id) {
      await this.ttsModel
        .findByIdAndUpdate(tts.id, persistenceModel, { upsert: true })
        .exec();
      return tts;
    } else {
      const created = await this.ttsModel.create(persistenceModel);
      return this.mapToEntity(created.toObject());
    }
  }

  async updateStatus(
    id: string,
    status: TTSStatus,
    errorMessage?: string,
  ): Promise<void> {
    const update: Record<string, unknown> = { status, updatedAt: new Date() };
    if (errorMessage) {
      update.errorMessage = errorMessage;
    }
    await this.ttsModel.findByIdAndUpdate(id, update).exec();
  }

  async deleteByChapterId(chapterId: string): Promise<void> {
    await this.ttsModel
      .deleteMany({ chapterId: new Types.ObjectId(chapterId) })
      .exec();
  }

  private mapToEntity(doc: object): TextToSpeechEntity {
    const d = doc as {
      _id: Types.ObjectId;
      chapterId: Types.ObjectId;
      bookId: Types.ObjectId;
      text: string;
      voice: string;
      language: string;
      speed: number;
      status: TTSStatus;
      audioUrl?: string;
      audioFormat?: string;
      audioDuration?: number;
      characterCount?: number;
      paragraphCount?: number;
      errorMessage?: string;
      playCount?: number;
      lastPlayedAt?: Date;
      createdAt: Date;
      updatedAt: Date;
      processedAt?: Date;
    };
    return TextToSpeechEntity.reconstitute({
      id: d._id.toString(),
      chapterId: d.chapterId.toString(),
      bookId: d.bookId.toString(),
      text: d.text,
      voice: d.voice,
      language: d.language,
      speed: d.speed,
      status: d.status,
      audioUrl: d.audioUrl,
      audioFormat: d.audioFormat,
      audioDuration: d.audioDuration,
      characterCount: d.characterCount,
      paragraphCount: d.paragraphCount,
      errorMessage: d.errorMessage,
      playCount: d.playCount ?? 0,
      lastPlayedAt: d.lastPlayedAt,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      processedAt: d.processedAt,
    });
  }

  private mapToPersistence(
    entity: TextToSpeechEntity,
  ): Partial<TextToSpeechDocument> {
    const persistence: Partial<TextToSpeechDocument> = {
      chapterId: new Types.ObjectId(entity.chapterId),
      bookId: new Types.ObjectId(entity.bookId),
      text: entity.text,
      voice: entity.voice,
      language: entity.language,
      speed: entity.speed,
      status: entity.status,
      audioUrl: entity.audioUrl,
      audioFormat: entity.audioFormat,
      audioDuration: entity.audioDuration,
      characterCount: entity.text.length,
      updatedAt: entity.updatedAt || new Date(),
    };
    if (entity.id) {
      persistence._id = new Types.ObjectId(entity.id);
    }
    return persistence;
  }
}
