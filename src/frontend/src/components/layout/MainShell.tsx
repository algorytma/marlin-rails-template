import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Folder, Activity, Server, Layout, Settings } from "lucide-react";
import React, { useState } from "react";

interface MainShellProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: "files", label: "Files", icon: Folder },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "services", label: "Services", icon: Server },
  { id: "projects", label: "Projects", icon: Layout },
  { id: "system", label: "System", icon: Settings },
];

export function MainShell({ children, activeTab, onTabChange }: MainShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavItems = () => (
    <nav className="flex flex-col gap-2 p-4">
      {TABS.map((t) => {
        const Icon = t.icon;
        const isActive = activeTab === t.id;
        return (
          <Button
            key={t.id}
            variant={isActive ? "secondary" : "ghost"}
            className={`justify-start ${isActive ? "bg-accent" : ""}`}
            onClick={() => {
              onTabChange(t.id);
              setMobileOpen(false);
            }}
          >
            <Icon className="mr-2 h-4 w-4" />
            {t.label}
          </Button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      {/* Topbar */}
      <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px]">
              <span className="font-semibold px-2">Mission Control</span>
            </div>
            <NavItems />
          </SheetContent>
        </Sheet>
        <div className="w-full flex-1">
          <span className="font-semibold hidden md:inline px-4">AI Ops Mission Control</span>
        </div>
        <div>
          {/* Theme toggle / User avatar placeholder */}
          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
            U
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 border-r bg-muted/40 md:block">
          <NavItems />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
