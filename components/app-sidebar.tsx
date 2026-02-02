"use client";

import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Upload,
  History as HistoryIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import type { User } from "@/lib/types/user";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";

interface AppSidebarProps {
  user?: User;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  const role = user?.role;

  // Define menu logic dynamically
  const menuItems = [
    {
      category: "Quản lý",
      items: [
        { name: "Hồ sơ", href: "/", icon: LayoutDashboard }, // All
        // Borrow: SuperAdmin, Admin, Coordinator
        ...(role === "SUPER_ADMIN" || role === "ADMIN" || role === "COORDINATOR"
          ? [{ name: "Mượn trả", href: "/borrow", icon: FileText }]
          : []),
        // Users: SuperAdmin only
        ...(role === "SUPER_ADMIN"
          ? [
              { name: "Người dùng", href: "/users", icon: Users },
              { name: "Nhật ký", href: "/admin/audit", icon: HistoryIcon },
            ]
          : []),
        // Upload: SuperAdmin or Admin
        ...(role === "SUPER_ADMIN" || role === "ADMIN"
          ? [{ name: "Nhập liệu", href: "/upload", icon: Upload }]
          : []),
      ],
    },
    {
      category: "Báo cáo",
      items: [{ name: "Thống kê", href: "/reports", icon: BarChart3 }],
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <span className="text-base font-semibold">
                  Phần mềm chỉnh lý hồ sơ
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {menuItems.map((group, idx) => (
          <SidebarGroup key={idx}>
            <SidebarGroupLabel>{group.category}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.name}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
