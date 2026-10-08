export class CreateReviewDto {
  bookId: string;
  content: string;
  rating: number;

  constructor(bookId: string, content: string, rating: number) {
    this.bookId = bookId;
    this.content = content;
    this.rating = rating;
  }
}
