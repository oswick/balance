
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X, ChevronDown } from "lucide-react";

import { useAuth } from "@/context/auth-provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { user, supabase } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const showAuthButtons = !user && !['/', '/login', '/signup'].includes(pathname);

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-border bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 items-center px-4">
        {/* Left: Logo / Title */}
        <Link href={user ? "/dashboard" : "/"} className="font-bold text-lg mr-6">
          Balance
        </Link>

        {/* Center: Navigation (Authenticated) */}
        {user && (
          <nav className="hidden md:flex flex-1 justify-center items-center space-x-2 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors px-3 py-2 rounded-md whitespace-nowrap",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground/60 hover:text-foreground/80"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
        
        <div className="flex-1 md:hidden"></div>


        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          {user ? (
            <>
              {/* Desktop User Menu */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="font-bold uppercase border-2">
                      Más
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-48 border-2 border-border bg-background shadow-brutal"
                    sideOffset={8}
                  >
                    <DropdownMenuItem asChild className="font-medium">
                      <Link href="/profile" className="flex items-center w-full">
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="font-medium">
                      <Link href="/settings" className="flex items-center w-full">
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="font-medium text-destructive focus:text-destructive-foreground focus:bg-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile menu toggle */}
              <div className="md:hidden">
                <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
                  {isMobileMenuOpen ? <X /> : <Menu />}
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </div>
            </>
          ) : showAuthButtons && (
                <Button asChild variant="default" size="sm">
                    <Link href="/login">Login</Link>
                </Button>
            )
          }
        </div>
      </div>

      {/* Mobile Menu Dropdown (Authenticated) */}
      {user && isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b-2 border-border shadow-brutal">
          <div className="flex flex-col gap-2 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "block rounded-md p-3 text-base font-medium transition-colors border-2 border-transparent",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground border-border"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-border"
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t-2 border-border mt-2 pt-2">
                <Link 
                  href="/profile" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="block rounded-md p-3 text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-border"
                >
                  Profile
                </Link>
                <Link 
                  href="/settings" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="block rounded-md p-3 text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-border"
                >
                  Settings
                </Link>
            </div>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="mt-2 font-bold uppercase border-2"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
