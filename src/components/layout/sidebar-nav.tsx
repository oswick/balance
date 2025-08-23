"use client";

import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

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

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <Banknote className="w-6 h-6 text-primary" />
            <span className="text-lg font-semibold text-primary">BizBalance</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
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
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
