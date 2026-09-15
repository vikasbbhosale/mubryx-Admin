import AdminSidebar from '@/components/layouts/AdminSidebar';
import AdminHeader from '@/components/layouts/AdminHeader';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 overflow-hidden antialiased selection:bg-blue-600 selection:text-white">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-7 custom-scrollbar bg-slate-950/80">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

