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
  SidebarMenuSub,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next-intl/navigation";
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
  BarChart3,
  Settings,
  ChevronsUpDown,
} from "lucide-react";
import { useAuth } from "@/context/auth-provider";
import { useTranslations } from "next-intl";

const analyticsGroup = [
  { href: "/", label: "dashboard", icon: LayoutDashboard },
  { href: "/smart-buy", label: "smartBuy", icon: Lightbulb },
];

const operationsGroup = [
  { href: "/sales", label: "sales", icon: DollarSign },
  { href: "/purchases", label: "purchases", icon: ShoppingCart },
  { href: "/expenses", label: "expenses", icon: Receipt },
]

const managementGroup = [
  { href: "/products", label: "products", icon: Package },
  { href: "/inventory", label: "inventory", icon: Archive },
  { href: "/suppliers", label: "suppliers", icon: Users },
]


export function SidebarNav() {
  const pathname = usePathname();
  const { supabase } = useAuth();
  const router = useRouter();
  const t = useTranslations("Sidebar");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <Banknote className="w-6 h-6 text-primary" />
            <span className="text-lg font-semibold text-primary group-data-[collapsible=icon]:hidden">{t('title')}</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarGroup>
              <SidebarGroupLabel>{t('groups.analytics')}</SidebarGroupLabel>
              <SidebarGroupContent>
                 {analyticsGroup.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                      tooltip={t(`items.${item.label}`)}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{t(`items.${item.label}`)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarGroupContent>
          </SidebarGroup>
           <SidebarGroup>
              <SidebarGroupLabel>{t('groups.operations')}</SidebarGroupLabel>
              <SidebarGroupContent>
                 {operationsGroup.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                      tooltip={t(`items.${item.label}`)}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{t(`items.${item.label}`)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarGroupContent>
          </SidebarGroup>
           <SidebarGroup>
              <SidebarGroupLabel>{t('groups.management')}</SidebarGroupLabel>
              <SidebarGroupContent>
                 {managementGroup.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                      tooltip={t(`items.${item.label}`)}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{t(`items.${item.label}`)}</span>
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
            <SidebarMenuButton onClick={handleLogout} tooltip={t('logout')}>
              <LogOut />
              <span>{t('logout')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
