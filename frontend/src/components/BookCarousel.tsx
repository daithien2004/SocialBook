'use client';

import { Book } from '../features/books/types/book.interface';
import { Card, CardContent } from '@/src/components/ui/card';
interface BookCarouselProps {
  title: string;
  books: Book[];
}

export function BookCarousel({ title, books }: BookCarouselProps) {
  return (
    <section className={`py-12 px-4 rounded-2xl`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-balance mb-2">{title}</h2>
            <p className="text-muted-foreground">
              Khám phá những câu chuyện tuyệt vời
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <div className="flex transition-transform duration-500 ease-out gap-6 p-4 overflow-x-scroll overflow-y-hidden">
            {books.map((book, index) => (
              <div key={book.id} className="flex-none w-1/3">
                <Card className="group hover:shadow-xl transition-all duration-300 bg-white/80">
                  <CardContent>
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={book.cover || '/placeholder.svg'}
                        alt={book.title}
                        className="w-full h-64 object-cover"
                      />
                    </div>

                    <div className="flex flex-col space-y-2 p-6">
                      <div className="p-2 rounded-lg bg-amber-600 font-medium text-white text-xs self-start">
                        {book.genre}
                      </div>

                      <h3 className="font-bold text-lg line-clamp-2">
                        {book.title}
                      </h3>

                      <p className="text-gray-500 text-sm">bởi {book.author}</p>

                      <p className="text-sm text-gray-600">
                        {book.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
