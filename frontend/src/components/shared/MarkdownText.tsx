export const MarkdownText = ({ text }: { text: string }) => {
  const paragraphs = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return (
    <div className="space-y-2">
      {paragraphs.map((para, pi) => (
        <p key={pi}>
          <InlineBold text={para} />
        </p>
      ))}
    </div>
  );
};

const InlineBold = ({ text }: { text: string }) => {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>,
      )}
    </>
  );
};
