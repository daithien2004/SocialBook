export class Genre {
    id?: string;
    name: string;
    slug?: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;

    constructor(partial: Partial<Genre>) {
        Object.assign(this, partial);
    }
}
