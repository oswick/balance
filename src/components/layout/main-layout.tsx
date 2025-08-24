
import { Header } from "./header";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 py-8 max-w-6xl">
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}
