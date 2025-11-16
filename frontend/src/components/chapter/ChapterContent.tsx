export function ChapterContent({
  paragraphs,
}: {
  paragraphs: Array<{ id: string; content: string }>;
}) {
  return (
    <main className="flex-1 max-w-3xl mx-auto w-full p-6 bg-white text-gray-800 rounded-t">
      <article className="prose prose-lg max-w-none space-y-6">
        {paragraphs.map((para, idx) => (
          <p
            key={`${para.id}-${idx}`}
            className="text-lg leading-8 text-justify"
          >
            {para.content}
          </p>
        ))}
      </article>
    </main>
  );
}
