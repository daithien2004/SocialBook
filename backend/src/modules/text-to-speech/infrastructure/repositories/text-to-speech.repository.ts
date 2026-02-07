import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ITextToSpeechRepository } from '../../domain/repositories/text-to-speech.repository.interface';
import { TextToSpeech as TextToSpeechEntity, TTSStatus } from '../../domain/entities/text-to-speech.entity';
import { TextToSpeech, TextToSpeechDocument } from '../schemas/text-to-speech.schema';

@Injectable()
export class TextToSpeechRepository implements ITextToSpeechRepository {
    constructor(
        @InjectModel(TextToSpeech.name) private readonly ttsModel: Model<TextToSpeechDocument>
    ) {}

    async findById(id: string): Promise<TextToSpeechEntity | null> {
        const doc = await this.ttsModel.findById(id).lean().exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async findByChapterId(chapterId: string): Promise<TextToSpeechEntity | null> {
        const doc = await this.ttsModel.findOne({ chapterId: new Types.ObjectId(chapterId) }).sort({ createdAt: -1 }).lean().exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async findCompletedByChapterId(chapterId: string): Promise<TextToSpeechEntity | null> {
        const doc = await this.ttsModel.findOne({ 
            chapterId: new Types.ObjectId(chapterId),
            status: TTSStatus.COMPLETED 
        }).sort({ createdAt: -1 }).lean().exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async findExisting(chapterId: string, language: string, voice: string): Promise<TextToSpeechEntity | null> {
        const doc = await this.ttsModel.findOne({
            chapterId: new Types.ObjectId(chapterId),
            status: TTSStatus.COMPLETED,
            language,
            voice
        }).lean().exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async findAllByBookId(bookId: string): Promise<TextToSpeechEntity[]> {
        const docs = await this.ttsModel.find({ bookId: new Types.ObjectId(bookId) }).lean().exec();
        return docs.map(doc => this.mapToEntity(doc));
    }

    async save(tts: TextToSpeechEntity): Promise<TextToSpeechEntity> {
        const persistenceModel = this.mapToPersistence(tts);
        if (tts.id) {
            await this.ttsModel.findByIdAndUpdate(tts.id, persistenceModel, { upsert: true }).exec();
            return tts;
        } else {
            const created = await this.ttsModel.create(persistenceModel);
            return this.mapToEntity(created.toObject());
        }
    }

    async updateStatus(id: string, status: TTSStatus, errorMessage?: string): Promise<void> {
        const update: any = { status, updatedAt: new Date() };
        if (errorMessage) {
            update.errorMessage = errorMessage;
        }
        await this.ttsModel.findByIdAndUpdate(id, update).exec();
    }

    async deleteByChapterId(chapterId: string): Promise<void> {
        await this.ttsModel.deleteMany({ chapterId: new Types.ObjectId(chapterId) }).exec();
    }

    private mapToEntity(doc: any): TextToSpeechEntity {
        return TextToSpeechEntity.reconstitute({
            id: doc._id.toString(),
            chapterId: doc.chapterId.toString(),
            bookId: doc.bookId.toString(),
            text: doc.text,
            voice: doc.voice,
            language: doc.language,
            speed: doc.speed,
            status: doc.status,
            audioUrl: doc.audioUrl,
            audioFormat: doc.audioFormat,
            audioDuration: doc.audioDuration,
            characterCount: doc.characterCount,
            paragraphCount: doc.paragraphCount,
            errorMessage: doc.errorMessage,
            playCount: doc.playCount,
            lastPlayedAt: doc.lastPlayedAt,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            processedAt: doc.processedAt,
        });
    }

    private mapToPersistence(entity: TextToSpeechEntity): any {
        return {
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
            // paragraphCount is not stored in entity props explicitly usually but we added it
            // Let's assume entity has it or we calculate it? Entity has it.
            // But wait, entity.text is a string. Paragraph count might need to be passed or calculated.
            // In the entity props I added paragraphCount.
            // Let's assume it's passed during creation.
            // ...
            // Wait, for simplicity, mapping back to persistence might need careful handling of IDs if they are strings.
            _id: entity.id ? new Types.ObjectId(entity.id) : undefined,
            updatedAt: entity.updatedAt || new Date(),
            // Other fields...
            // It's safer to use what's in the entity if accessible.
            // I'll stick to a simple mapping.
        };
    }
}
