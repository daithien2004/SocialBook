export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-screen bg-gray-100 p-4">
      {children}
    </section>
  );
}
