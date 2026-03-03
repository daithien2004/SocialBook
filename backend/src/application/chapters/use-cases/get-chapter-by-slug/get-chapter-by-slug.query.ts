export class GetChapterBySlugQuery {
    constructor(public readonly chapterSlug: string, public readonly bookSlug: string) { }
}