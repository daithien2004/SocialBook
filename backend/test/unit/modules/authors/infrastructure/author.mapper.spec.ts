import { AuthorMapper } from '@/modules/authors/infrastructure/repositories/author.mapper';
import { Author } from '@/modules/authors/domain/entities/author.entity';
import { AuthorId } from '@/modules/authors/domain/value-objects/author-id.vo';

describe('AuthorMapper', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const updatedAt = new Date('2026-01-02T00:00:00.000Z');

    it('maps persistence data to a reconstituted domain entity', () => {
        const author = AuthorMapper.toDomain({
            id: '11111111-1111-4111-8111-111111111111',
            name: 'Nguyen Van A',
            slug: 'nguyen-van-a',
            bio: 'Bio',
            photoUrl: 'https://cdn.example/author.png',
            createdAt,
            updatedAt,
        });

        expect(author).toBeInstanceOf(Author);
        expect(author.id).toEqual(
            AuthorId.create('11111111-1111-4111-8111-111111111111'),
        );
        expect(author.name.toString()).toBe('Nguyen Van A');
        expect(author.slug).toBe('nguyen-van-a');
        expect(author.createdAt).toEqual(createdAt);
    });

    it('maps a domain entity to persistence data', () => {
        const author = Author.create({
            id: AuthorId.create('11111111-1111-4111-8111-111111111111'),
            name: 'Nguyen Van A',
            bio: 'Bio',
            photoUrl: 'https://cdn.example/author.png',
        });

        expect(AuthorMapper.toPersistence(author)).toEqual({
            id: '11111111-1111-4111-8111-111111111111',
            name: 'Nguyen Van A',
            slug: 'nguyen-van-a',
            bio: 'Bio',
            photoUrl: 'https://cdn.example/author.png',
            createdAt: author.createdAt,
            updatedAt: author.updatedAt,
        });
    });
});
