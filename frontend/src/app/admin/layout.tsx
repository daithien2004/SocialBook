import AdminAuthGate from './_components/AdminAuthGate';
import AdminSidebar from './_components/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGate>
      <div className="h-screen bg-gray-50 flex flex-col md:flex-row overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 ml-0 px-5 overflow-y-auto">
          {children}
        </main>
      </div>
    </AdminAuthGate>
  );
}
