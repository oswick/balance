"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Banknote, LogOut, Menu, X } from "lucide-react";

import { useAuth } from "@/context/auth-provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/sales", label: "Sales" },
    { href: "/purchases", label: "Purchases" },
    { href: "/expenses", label: "Expenses" },
    { href: "/products", label: "Products" },
    { href: "/inventory", label: "Inventory" },
    { href: "/suppliers", label: "Suppliers" },
    { href: "/smart-buy", label: "Smart Buy" },
];

export function Header() {
  const pathname = usePathname();
  const { supabase } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-border bg-background/95 backdrop-blur-sm">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <Banknote className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              BizBalance
            </span>
          </Link>
          <nav className="flex items-center space-x-2 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground/80 px-3 py-2 rounded-md",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground/60"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile Menu */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:hidden">
          <Link href="/dashboard" className="flex items-center space-x-2">
             <Banknote className="h-6 w-6" />
             <span className="font-bold">BizBalance</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? <X/> : <Menu />}
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-4">
            <Button variant="ghost" onClick={handleLogout} className="hidden md:inline-flex">
                <LogOut className="mr-2 h-4 w-4"/>
                Logout
            </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="flex flex-col gap-2 p-4 border-t-2 border-border">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "block rounded-md p-3 text-base font-medium",
                  pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
            <Button variant="outline" onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
            }}>
                <LogOut className="mr-2 h-4 w-4"/>
                Logout
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
