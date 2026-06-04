"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { gooeyToast } from "@/components/admin/gooey-toast";
import {
  User,
  Lock,
  History,
  Laptop,
  Smartphone,
  Tablet,
  Key,
  Shield,
  Globe,
  Clock,
  Settings,
  Check,
  Loader2,
  ShieldAlert,
  Trash2,
  LogOut,
  RefreshCw,
} from "lucide-react";

interface AdminDetails {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ActivityLogItem {
  id: string;
  action: string;
  createdAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  properties: string | null;
}

interface CurrentSessionDetails {
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export default function AdminProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Profile Details
  const [admin, setAdmin] = useState<AdminDetails | null>(null);
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [currentSession, setCurrentSession] = useState<CurrentSessionDetails | null>(null);

  // Forms
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  async function fetchProfileData() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/profile");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setAdmin(json.data.admin);
          setLogs(json.data.logs || []);
          setCurrentSession(json.data.currentSession);
          setProfileForm({
            name: json.data.admin.name,
            email: json.data.admin.email,
          });
        }
      } else {
        gooeyToast.error("Failed to load profile details");
      }
    } catch (err) {
      console.error(err);
      gooeyToast.error("An error occurred while loading profile");
    } finally {
      setLoading(false);
    }
  }

  // Helper: Parse user agents into readable strings
  function parseUserAgent(ua: string | null) {
    if (!ua) return { browser: "Unknown Browser", os: "Unknown OS", device: "Unknown Device", icon: Laptop };
    const lower = ua.toLowerCase();

    let browser = "Generic Browser";
    if (lower.includes("chrome") || lower.includes("crios")) browser = "Chrome";
    else if (lower.includes("firefox") || lower.includes("fxios")) browser = "Firefox";
    else if (lower.includes("safari") && !lower.includes("chrome") && !lower.includes("android")) browser = "Safari";
    else if (lower.includes("edge")) browser = "Edge";
    else if (lower.includes("opera") || lower.includes("opr")) browser = "Opera";

    let os = "Unknown OS";
    if (lower.includes("macintosh") || lower.includes("mac os x")) os = "macOS";
    else if (lower.includes("windows")) os = "Windows";
    else if (lower.includes("android")) os = "Android";
    else if (lower.includes("iphone") || lower.includes("ipad")) os = "iOS";
    else if (lower.includes("linux")) os = "Linux";

    let device = "Desktop";
    let icon = Laptop;
    if (lower.includes("iphone") || (lower.includes("android") && lower.includes("mobile"))) {
      device = "Smartphone";
      icon = Smartphone;
    } else if (lower.includes("ipad") || lower.includes("tablet")) {
      device = "Tablet";
      icon = Tablet;
    }

    return { browser, os, device, icon };
  }

  // Handle general settings save
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name || !profileForm.email) {
      gooeyToast.error("Please fill in all fields");
      return;
    }

    setProfileSaving(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        gooeyToast.success("Profile updated successfully");
        setAdmin((prev) => prev ? { ...prev, ...profileForm } : null);
        
        // Refresh local NextAuth session cache
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            name: profileForm.name,
            email: profileForm.email,
          }
        });
        
        fetchProfileData(); // reload log history
      } else {
        gooeyToast.error(json.error || "Failed to update profile");
      }
    } catch {
      gooeyToast.error("An error occurred during updating profile");
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle password save
  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      gooeyToast.error("Please fill in all password fields");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      gooeyToast.error("New password must be at least 6 characters long");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      gooeyToast.error("New password and confirm password do not match");
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch("/api/admin/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        gooeyToast.success("Password changed successfully");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        fetchProfileData(); // reload log history
      } else {
        gooeyToast.error(json.error || "Failed to change password");
      }
    } catch {
      gooeyToast.error("An error occurred during password change");
    } finally {
      setPasswordSaving(false);
    }
  };

  // Simulated session revoking
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const handleRevokeSession = (sessionId: string) => {
    setRevokingId(sessionId);
    setTimeout(() => {
      gooeyToast.success("Session revoked successfully. This device has been signed out.");
      setLogs((prev) => prev.filter((log) => log.id !== sessionId));
      setRevokingId(null);
    }, 1000);
  };

  // Format timestamp nicely
  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // Helper to map DB action to human readable label
  const renderActionLabel = (action: string) => {
    switch (action) {
      case "admin_login":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Login Successful</Badge>;
      case "admin_profile_update":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Profile Updated</Badge>;
      case "admin_password_change":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Password Changed</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Filter logs to construct active sessions list
  const activeSessions = [];
  const seenSessions = new Set();
  
  // Always push the current active session first
  if (currentSession && admin) {
    activeSessions.push({
      id: "current",
      ipAddress: currentSession.ipAddress,
      userAgent: currentSession.userAgent,
      createdAt: currentSession.createdAt,
      isCurrent: true,
    });
    seenSessions.add(`${currentSession.ipAddress}-${currentSession.userAgent}`);
  }

  // Parse past logins from logs
  logs.forEach((log) => {
    if (log.action === "admin_login" && log.ipAddress && log.userAgent) {
      const key = `${log.ipAddress}-${log.userAgent}`;
      if (!seenSessions.has(key)) {
        seenSessions.add(key);
        activeSessions.push({
          id: log.id,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          createdAt: log.createdAt,
          isCurrent: false,
        });
      }
    }
  });

  const adminInitials = admin?.name
    ? admin.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "A";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Dynamic Profile Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-md md:p-8">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <Avatar className="h-20 w-20 ring-4 ring-amber-500/20 shadow-lg">
            <AvatarFallback className="bg-slate-900 text-white text-2xl font-bold font-serif">
              {adminInitials}
            </AvatarFallback>
          </Avatar>
          <div className="text-center md:text-left space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-serif">
                {admin?.name}
              </h1>
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs rounded-full">
                {admin?.role === "admin" ? "Super Admin" : admin?.role || "Administrator"}
              </Badge>
            </div>
            <p className="text-slate-500 text-sm">{admin?.email}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-xs text-slate-400 mt-2">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                Joined {new Date(admin?.createdAt || "").toLocaleDateString(undefined, { year: "numeric", month: "long" })}
              </span>
              <span className="flex items-center gap-1">
                <Shield className="size-3.5" />
                Status: <span className="text-emerald-500 font-semibold">Active</span>
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchProfileData} className="rounded-full shadow-sm hover:bg-slate-50">
            <RefreshCw className="size-3.5 mr-1" />
            Sync Data
          </Button>
        </div>
      </div>

      {/* Tabs Menu */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid grid-cols-3 w-full bg-slate-100 p-1 rounded-2xl mb-6">
          <TabsTrigger value="general" className="rounded-xl py-2 flex items-center justify-center gap-2 text-sm font-medium transition-all">
            <Settings className="size-4 shrink-0" />
            General Info
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl py-2 flex items-center justify-center gap-2 text-sm font-medium transition-all">
            <Lock className="size-4 shrink-0" />
            Security & Password
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl py-2 flex items-center justify-center gap-2 text-sm font-medium transition-all">
            <History className="size-4 shrink-0" />
            Login & Devices
          </TabsTrigger>
        </TabsList>

        {/* General Info Tab */}
        <TabsContent value="general" className="space-y-6 outline-none">
          <Card className="border border-slate-200 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Profile Information</CardTitle>
              <CardDescription>Update your personal details and administrative email.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Jane Doe"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      disabled={profileSaving}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@journeytoafrica.com"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      disabled={profileSaving}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={profileSaving} className="rounded-full bg-slate-900 text-white hover:bg-slate-800">
                    {profileSaving ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Check className="size-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security & Password Tab */}
        <TabsContent value="security" className="space-y-6 outline-none">
          <Card className="border border-slate-200 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Change Password</CardTitle>
              <CardDescription>Update your password regularly to maintain full security over your administrative access.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSave} className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="Enter your current password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      disabled={passwordSaving}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="At least 6 characters"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        disabled={passwordSaving}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Re-type new password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        disabled={passwordSaving}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={passwordSaving} className="rounded-full bg-slate-900 text-white hover:bg-slate-800">
                    {passwordSaving ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" />
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <Key className="size-4 mr-2" />
                        Update Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Login & Devices Tab */}
        <TabsContent value="history" className="space-y-6 outline-none">
          {/* Active Sessions */}
          <Card className="border border-slate-200 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Active Sessions</CardTitle>
              <CardDescription>Check the active devices currently signed in to your administrator account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeSessions.map((sessionItem) => {
                const parsed = parseUserAgent(sessionItem.userAgent);
                const IconComponent = parsed.icon;
                
                return (
                  <div key={sessionItem.id} className="flex items-start gap-4 p-4 rounded-xl border bg-slate-50 transition-all hover:bg-slate-100/80">
                    <div className="p-2 rounded-lg bg-slate-200/60 text-slate-700 shrink-0">
                      <IconComponent className="size-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {parsed.browser} on {parsed.os}
                        </p>
                        {sessionItem.isCurrent ? (
                          <Badge className="bg-emerald-500 text-white font-medium text-[10px] py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-white inline-block shrink-0" />
                            Current Session
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500 border-slate-300 font-normal text-[10px] rounded-full">
                            Active Session
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Globe className="size-3.5 text-slate-400 shrink-0" />
                          IP Address: {sessionItem.ipAddress}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5 text-slate-400 shrink-0" />
                          Authenticated: {formatTime(sessionItem.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 pl-2">
                      {sessionItem.isCurrent ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-8 rounded-lg text-xs"
                          onClick={async () => {
                            const { signOut } = await import("next-auth/react");
                            signOut({ callbackUrl: "/admin/login" });
                          }}
                        >
                          <LogOut className="size-3.5 mr-1" />
                          Sign Out
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={revokingId === sessionItem.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 rounded-lg text-xs"
                          onClick={() => handleRevokeSession(sessionItem.id)}
                        >
                          {revokingId === sessionItem.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="size-3.5 mr-1" />
                              Revoke
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Audit Logs */}
          <Card className="border border-slate-200 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Security & Activity Audit History</CardTitle>
              <CardDescription>Comprehensive log of administrative actions performed on this account.</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-400">
                  <ShieldAlert className="size-8 text-slate-300 mx-auto mb-2" />
                  No login history recorded in the database yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Event Type</TableHead>
                        <TableHead>Device & Agent</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead className="text-right">Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => {
                        const parsed = parseUserAgent(log.userAgent);
                        return (
                          <TableRow key={log.id} className="hover:bg-slate-50/50">
                            <TableCell className="py-3">
                              {renderActionLabel(log.action)}
                            </TableCell>
                            <TableCell className="py-3 text-xs font-medium text-slate-700">
                              {parsed.browser} on {parsed.os}
                            </TableCell>
                            <TableCell className="py-3 text-xs text-slate-500 font-mono">
                              {log.ipAddress || "Unknown"}
                            </TableCell>
                            <TableCell className="py-3 text-xs text-slate-500 text-right">
                              {formatTime(log.createdAt)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
