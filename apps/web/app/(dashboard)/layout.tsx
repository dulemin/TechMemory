export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* TODO: Add Navbar/Sidebar später */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
