
"use client";

import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  DollarSign,
  Receipt,
  Package,
  ShoppingCart,
  Users,
  Lightbulb,
  Banknote,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/auth-provider";

const menuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sales", label: "Sales", icon: DollarSign },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/products", label: "Products", icon: Package },
  { href: "/purchases", label: "Purchases", icon: ShoppingCart },
  { href: "/suppliers", label: "Suppliers", icon: Users },
  { href: "/smart-buy", label: "Smart Buy", icon: Lightbulb },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { supabase } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <Banknote className="w-6 h-6 text-primary" />
            <span className="text-lg font-semibold text-primary group-data-[collapsible=icon]:hidden">Balance</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Log out">
              <LogOut />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
