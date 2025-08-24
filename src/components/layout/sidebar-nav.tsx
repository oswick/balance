"use client";

import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
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
  Archive,
} from "lucide-react";
import { useAuth } from "@/context/auth-provider";

const analyticsGroup = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/smart-buy", label: "Smart Buy", icon: Lightbulb },
];

const operationsGroup = [
  { href: "/sales", label: "Sales", icon: DollarSign },
  { href: "/purchases", label: "Purchases", icon: ShoppingCart },
  { href: "/expenses", label: "Expenses", icon: Receipt },
]

const managementGroup = [
  { href: "/products", label: "Products", icon: Package },
  { href: "/inventory", label: "Inventory", icon: Archive },
  { href: "/suppliers", label: "Suppliers", icon: Users },
]


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
            <span className="text-lg font-semibold text-primary group-data-[collapsible=icon]:hidden">BizBalance</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarGroup>
              <SidebarGroupLabel>Analytics</SidebarGroupLabel>
              <SidebarGroupContent>
                 {analyticsGroup.map((item) => (
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
              </SidebarGroupContent>
          </SidebarGroup>
           <SidebarGroup>
              <SidebarGroupLabel>Operations</SidebarGroupLabel>
              <SidebarGroupContent>
                 {operationsGroup.map((item) => (
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
              </SidebarGroupContent>
          </SidebarGroup>
           <SidebarGroup>
              <SidebarGroupLabel>Management</SidebarGroupLabel>
              <SidebarGroupContent>
                 {managementGroup.map((item) => (
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
              </SidebarGroupContent>
          </SidebarGroup>
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
