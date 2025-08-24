
"use client";

import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "./sidebar-nav";
import { useSidebar } from "@/components/ui/sidebar";

function AppHeader() {
    const { isMobile, openMobile, setOpenMobile } = useSidebar();
    
    // Do not render the header on desktop
    if (!isMobile) return null;

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
            <SidebarTrigger onClick={() => setOpenMobile(!openMobile)} />
            <h1 className="font-bold text-lg">BizBalance</h1>
        </header>
    );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
         <AppHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
