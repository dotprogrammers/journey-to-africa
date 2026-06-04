"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AuthGuard } from "@/components/admin/auth-guard";
import { AuthProvider } from "@/components/admin/auth-provider";
import { GooeyToast } from "@/components/admin/gooey-toast-component";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Menu, Bell, LogOut, User, Calendar, DollarSign } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const routeLabels: Record<string, string> = {
  admin: "Admin",
  "landing-page": "Landing Page",
  sections: "Sections",
  bookings: "Bookings",
  pricing: "Pricing Tiers",
  payments: "Payments",
  invoices: "Invoices",
  emails: "Email Templates",
  settings: "Site Settings",
  media: "Media",
  users: "Users",
  login: "Login",
};

interface NotificationItem {
  id: string;
  type: "booking" | "payment";
  title: string;
  description: string;
  amount: number;
  reference: string;
  status: string;
  createdAt: string;
  link: string;
}

function AdminTopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);

  useEffect(() => {
    // Load read notifications list from localStorage
    const saved = localStorage.getItem("jta_read_notifications");
    if (saved) {
      try {
        setReadIds(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }

    async function fetchNotifications() {
      try {
        const res = await fetch("/api/admin/notifications");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setNotifications(data.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    }

    fetchNotifications();
    // Poll every 30 seconds for live notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadNotifications = notifications.filter(n => !readIds.includes(n.id));
  const unreadCount = unreadNotifications.length;

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    localStorage.setItem("jta_read_notifications", JSON.stringify(updated));
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!readIds.includes(item.id)) {
      const updated = [...readIds, item.id];
      setReadIds(updated);
      localStorage.setItem("jta_read_notifications", JSON.stringify(updated));
    }
    router.push(item.link);
  };

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: routeLabels[seg] || seg,
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="size-5" />
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.href} className="contents">
                  {i > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {crumb.isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={crumb.href}>
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-112.5 overflow-y-auto p-0">
              <div className="flex items-center justify-between p-3 border-b bg-muted/40 sticky top-0 backdrop-blur z-10">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-[10px] text-primary hover:text-primary/80 px-2 font-medium"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
              <div className="divide-y divide-border">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((item) => {
                    const isUnread = !readIds.includes(item.id);
                    const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    });
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        className={`w-full text-left p-3 hover:bg-muted/50 transition-colors flex gap-3 items-start relative ${
                          isUnread ? "bg-primary/5 hover:bg-primary/10" : ""
                        }`}
                      >
                        {isUnread && (
                          <span className="absolute left-2 top-4 w-1.5 h-1.5 bg-primary rounded-full" />
                        )}
                        <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                          item.type === "booking" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        }`}>
                          {item.type === "booking" ? (
                            <Calendar className="size-3.5" />
                          ) : (
                            <DollarSign className="size-3.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pl-1">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                            {item.description}
                          </p>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground/80">
                            <span className="font-mono">Ref: {item.reference}</span>
                            <span>{formattedDate}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-slate-900 text-white text-xs">
                    {session?.user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium">
                  {session?.user?.name || "Admin"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm">{session?.user?.name || "Admin"}</span>
                  <span className="text-xs text-muted-foreground">
                    {session?.user?.email || ""}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/admin/profile")}>
                <User className="mr-2 size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  const { signOut } = await import("next-auth/react");
                  signOut({ callbackUrl: "/admin/login" });
                }}
              >
                <LogOut className="mr-2 size-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Public pages that don't require authentication
  const publicPaths = ["/admin/login", "/admin/forgot-password", "/admin/verify-otp", "/admin/reset-password"];
  if (publicPaths.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminTopBar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-muted/30">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
      <GooeyToast />
    </AuthProvider>
  );
}
