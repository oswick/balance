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
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const NavGroup = ({ label, items }: { label: string, items: typeof analyticsGroup }) => (
     <Collapsible defaultOpen className="group/collapsible">
        <CollapsibleTrigger className="group flex w-full items-center justify-between p-2 text-sm font-bold uppercase text-sidebar-foreground/70 hover:text-sidebar-foreground">
           <span>{label}</span>
           <ChevronRight className="h-4 w-4 transform transition-transform duration-200 group-data-[state=open]:rotate-90" />
        </CollapsibleTrigger>
        <CollapsibleContent>
            <SidebarMenu className="pl-2">
            {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={item.label}
                        className="uppercase font-bold"
                    >
                    <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                    </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
            </SidebarMenu>
        </CollapsibleContent>
    </Collapsible>
  )

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
            <Banknote className="w-6 h-6 text-primary-foreground" />
            <span className="text-lg font-black uppercase text-primary-foreground group-data-[collapsible=icon]:hidden">BizBalance</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="flex flex-col gap-2">
          <NavGroup label="Analytics" items={analyticsGroup} />
          <NavGroup label="Operations" items={operationsGroup} />
          <NavGroup label="Management" items={managementGroup} />
        </div>
      </SidebarContent>
       <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Logout" className="uppercase font-bold">
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
