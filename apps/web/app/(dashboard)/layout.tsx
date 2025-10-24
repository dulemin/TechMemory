export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-brand-bg-start via-brand-bg-mid to-brand-bg-end">
      {/* TODO: Add Navbar/Sidebar später */}
      <main className="flex-1 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
