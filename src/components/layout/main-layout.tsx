"use client";

import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "./sidebar-nav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarNav />
      </Sidebar>
      <SidebarInset className="bg-background min-h-screen">
         <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
            <SidebarTrigger />
            <h1 className="font-bold text-lg">BizBalance</h1>
          </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
