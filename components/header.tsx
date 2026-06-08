"use client";

import { UserCircle, LogOut, Search } from "lucide-react";
import { usePathname, useRouter } from '@/src/lib/router';
import type { User } from "@/lib/types/user";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "./ui/sidebar";
import { useSession } from "@/lib/hooks/use-auth";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface HeaderProps {
  user?: User;
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useSession();

  if (pathname === "/login") return null;

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-command-palette'))}
              className="ml-4 hidden md:flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/50 border rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer w-64 text-left font-normal"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span>Tìm kiếm...</span>
              <kbd className="ml-auto pointer-events-none inline-flex h-4.5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[9px] font-medium opacity-100">
                <span className="text-[10px]">Ctrl</span> K
              </kbd>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            Tìm kiếm nhanh (Ctrl + K)
          </TooltipContent>
        </Tooltip>


        <div className="flex items-center ml-auto gap-1 px-4 lg:gap-2 lg:px-6">
          <div className="h-8 w-px bg-border mx-2"></div>
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">
                  {user.fullName}
                </p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>
              <UserCircle className="w-9 h-9 text-muted-foreground/50" />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="ml-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors h-10 w-10"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <UserCircle className="w-9 h-9 text-muted-foreground/50" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
