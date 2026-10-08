export class UpdateReviewDto {
  content?: string;
  rating?: number;

  constructor(content?: string, rating?: number) {
    this.content = content;
    this.rating = rating;
  }
}
