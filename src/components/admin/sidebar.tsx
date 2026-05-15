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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
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

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[280px] bg-slate-900 text-white flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-6 h-16 shrink-0">
          <Link href="/admin" className="flex items-center gap-2" onClick={onClose}>
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-sm font-bold text-white">
              J
            </div>
            <span className="text-lg font-semibold">JTA Admin</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>

        <Separator className="bg-slate-700" />

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href) && item.href !== "/admin";

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-slate-700/80 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <item.icon className="size-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Logout */}
        <div className="p-3 mt-auto">
          <Separator className="bg-slate-700 mb-3" />
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={async () => {
              const { signOut } = await import("next-auth/react");
              signOut({ callbackUrl: "/admin/login" });
            }}
          >
            <LogOut className="size-5" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>
    </>
  );
}
