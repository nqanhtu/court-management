import Header from "@/components/Header";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { getSession } from '@/lib/session'
import type { User } from "@/lib/types/user";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = (await getSession()) as User | null;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar user={session ?? undefined} />
      <SidebarInset>
        <Header user={session ?? undefined} />
        <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
          <div className="@container/main flex flex-1 flex-col gap-2 p-4 lg:p-8 md:p-6 min-h-0 overflow-auto max-w-360 mx-auto w-full">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
