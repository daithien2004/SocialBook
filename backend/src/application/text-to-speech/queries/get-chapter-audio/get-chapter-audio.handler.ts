import { GetChapterAudioQuery } from './get-chapter-audio.query';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { ITextToSpeechRepository } from '@/domain/text-to-speech/repositories/text-to-speech.repository.interface';
import { TextToSpeech } from '@/domain/text-to-speech/entities/text-to-speech.entity';

@QueryHandler(GetChapterAudioQuery)
export class GetChapterAudioHandler {
  constructor(private readonly ttsRepository: ITextToSpeechRepository) {}

  async execute(chapterId: string): Promise<TextToSpeech | null> {
    return this.ttsRepository.findCompletedByChapterId(chapterId);
  }
}
