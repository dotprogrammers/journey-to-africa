"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Layers,
  Image,
  CreditCard,
  CalendarCheck,
  DollarSign,
  FileText,
  Mail,
  Settings,
  Key,
  Users,
  LogOut,
  X,
  Monitor,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from "react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Landing Page", href: "/admin/landing-page", icon: Monitor },
  { label: "Sections", href: "/admin/sections", icon: Layers },
  { label: "Media", href: "/admin/media", icon: Image },
  { label: "Pricing Tiers", href: "/admin/pricing", icon: CreditCard },
  { label: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
  { label: "Payments", href: "/admin/payments", icon: DollarSign },
  { label: "Invoices", href: "/admin/invoices", icon: FileText },
  { label: "Email Templates", href: "/admin/emails", icon: Mail },
  { label: "Site Settings", href: "/admin/settings", icon: Settings },
  { label: "API Keys", href: "/admin/settings/api-keys", icon: Key },
  { label: "Users", href: "/admin/users", icon: Users },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const activeUserRole = (session?.user as { role?: string })?.role || "admin";

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("jta_sidebar_collapsed");
    if (saved !== null) {
      setCollapsed(saved === "true");
    }
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("jta_sidebar_collapsed", String(next));
  };

  const filteredNavItems = navItems.filter((item) => {
    if (item.href === "/admin/settings/api-keys" && activeUserRole !== "super_admin") {
      return false;
    }
    return true;
  });

  return (
    <TooltipProvider delayDuration={0}>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-slate-900 text-white flex flex-col overflow-hidden transition-all duration-300 lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full",
          collapsed ? "lg:w-18" : "lg:w-70",
          "w-70"
        )}
      >
        <div className={cn(
          "flex items-center h-16 shrink-0",
          collapsed ? "justify-center px-2" : "justify-between px-6"
        )}>
          <Link
            href="/admin"
            className="flex items-center gap-2"
            onClick={onClose}
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
              J
            </div>
            {!collapsed && (
              <span className="text-lg font-semibold whitespace-nowrap">JTA Admin</span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden shrink-0"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>

        <Separator className="bg-slate-700" />

        <ScrollArea className="flex-1 py-4 overflow-hidden">
          <nav className={cn("space-y-1", collapsed ? "px-2" : "px-3")}>
            {filteredNavItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === item.href;

              const linkContent = (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center rounded-lg text-sm font-medium transition-colors",
                    collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
                    isActive
                      ? "bg-slate-700/80 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <item.icon className="size-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.label}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkContent;
            })}
          </nav>
        </ScrollArea>

        <div className={cn("mt-auto", collapsed ? "p-2" : "p-3")}>
          <Separator className="bg-slate-700 mb-3" />

          <Button
            variant="ghost"
            className={cn(
              "hidden lg:flex w-full text-slate-400 hover:bg-slate-800 hover:text-white mb-1",
              collapsed ? "justify-center px-0" : "justify-start gap-3"
            )}
            onClick={toggleCollapsed}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-5 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="size-5 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </Button>

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-center px-0 text-slate-300 hover:bg-slate-800 hover:text-white"
                  onClick={async () => {
                    const { signOut } = await import("next-auth/react");
                    signOut({ callbackUrl: "/admin/login" });
                  }}
                >
                  <LogOut className="size-5 shrink-0" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Logout
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800 hover:text-white"
              onClick={async () => {
                const { signOut } = await import("next-auth/react");
                signOut({ callbackUrl: "/admin/login" });
              }}
            >
              <LogOut className="size-5 shrink-0" />
              <span>Logout</span>
            </Button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
