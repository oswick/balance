export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="container mx-auto flex-1 py-8 pt-12 md:pt-20 max-w-6xl">
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}
