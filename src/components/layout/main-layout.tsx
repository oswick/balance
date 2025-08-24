import { Header } from "./header";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {/* Padding top para compensar el header fijo */}
      <main className="container mx-auto flex-1 py-8 pt-20 max-w-6xl">
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}