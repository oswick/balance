
import { Header } from "./header";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container flex-1">{children}</div>
    </div>
  );
}
