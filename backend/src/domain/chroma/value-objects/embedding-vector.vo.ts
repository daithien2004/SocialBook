export class EmbeddingVector {
    private readonly value: number[];

    private constructor(vector: number[]) {
        this.value = vector;
    }

    static create(vector: number[]): EmbeddingVector {
        if (!Array.isArray(vector)) {
            throw new Error('Embedding vector must be an array');
        }

        if (vector.length > 0 && !vector.every(element => typeof element === 'number' && !isNaN(element))) {
            throw new Error('All elements in embedding vector must be valid numbers');
        }

        return new EmbeddingVector([...vector]);
    }

    static fromString(vectorString: string): EmbeddingVector {
        try {
            const vector = JSON.parse(vectorString);
            return EmbeddingVector.create(vector);
        } catch (error) {
            throw new Error('Invalid vector string format');
        }
    }

    toArray(): number[] {
        return [...this.value];
    }

    toString(): string {
        return JSON.stringify(this.value);
    }

    get length(): number {
        return this.value.length;
    }

    get(index: number): number {
        return this.value[index];
    }

    equals(other: EmbeddingVector): boolean {
        if (this.length !== other.length) {
            return false;
        }

        return this.value.every((value, index) => value === other.get(index));
    }

    calculateSimilarity(other: EmbeddingVector): number {
        if (this.length === 0 || other.length === 0 || this.length !== other.length) {
            return 0;
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < this.length; i++) {
            dotProduct += this.value[i] * other.get(i);
            normA += this.value[i] * this.value[i];
            normB += other.get(i) * other.get(i);
        }

        if (normA === 0 || normB === 0) {
            return 0;
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
