"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { gooeyToast } from "@/components/admin/gooey-toast";
import {
  Users,
  Search,
  Loader2,
  Mail,
  Phone,
  MapPin,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  UserPlus,
  Trash2,
  ShieldAlert,
  Activity,
  Globe,
  Clock,
  Monitor,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Lock,
  Unlock,
  Info,
} from "lucide-react";
import { format } from "date-fns";

// ============================================================
// INTERFACES
// ============================================================

interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  role: string;
  isActive: boolean;
  bookingsCount: number;
  createdAt: string;
}

interface AdminIpEntry {
  id: string;
  ipAddress: string;
  label: string | null;
  isActive: boolean;
  createdAt: string;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  ipWhitelists: AdminIpEntry[];
  _count: { activityLogs: number };
}

interface ActivityLogEntry {
  id: string;
  action: string;
  subjectType: string | null;
  subjectId: string | null;
  properties: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

// ============================================================
// ACTION LABEL HELPERS
// ============================================================

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  admin_login: { label: "Logged In", color: "bg-emerald-100 text-emerald-800" },
  admin_login_blocked_ip: { label: "Login Blocked (IP)", color: "bg-red-100 text-red-800" },
  admin_created: { label: "Admin Created", color: "bg-blue-100 text-blue-800" },
  admin_updated: { label: "Admin Updated", color: "bg-amber-100 text-amber-800" },
  admin_deleted: { label: "Admin Deleted", color: "bg-red-100 text-red-800" },
  admin_profile_update: { label: "Profile Updated", color: "bg-purple-100 text-purple-800" },
  admin_password_change: { label: "Password Changed", color: "bg-orange-100 text-orange-800" },
  admin_ip_added: { label: "IP Added", color: "bg-cyan-100 text-cyan-800" },
  admin_ip_removed: { label: "IP Removed", color: "bg-rose-100 text-rose-800" },
};

function getActionInfo(action: string) {
  return ACTION_LABELS[action] || { label: action, color: "bg-slate-100 text-slate-800" };
}

function parseProperties(properties: string | null): Record<string, unknown> {
  if (!properties) return {};
  try {
    return JSON.parse(properties);
  } catch {
    return {};
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function UsersPage() {
  const { data: session } = useSession();
  const activeUserRole = (session?.user as { role?: string })?.role || "admin";
  const isSuperAdmin = activeUserRole === "super_admin";

  // ---- Customer State ----
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customerSearchInput, setCustomerSearchInput] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSearching, setCustomerSearching] = useState(false);
  const [customerTogglingId, setCustomerTogglingId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerUser | null>(null);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);

  // ---- Admin State ----
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [adminsSyncing, setAdminsSyncing] = useState(false);
  const [adminTogglingId, setAdminTogglingId] = useState<string | null>(null);
  const [adminDeletingId, setAdminDeletingId] = useState<string | null>(null);
  const [addAdminDialogOpen, setAddAdminDialogOpen] = useState(false);
  const [addAdminSaving, setAddAdminSaving] = useState(false);

  // ---- Admin Detail Dialog State ----
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [adminDetailOpen, setAdminDetailOpen] = useState(false);
  const [adminDetailTab, setAdminDetailTab] = useState("overview");

  // ---- Activity Log State ----
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);

  // ---- IP Whitelist State ----
  const [adminIps, setAdminIps] = useState<AdminIpEntry[]>([]);
  const [ipsLoading, setIpsLoading] = useState(false);
  const [newIp, setNewIp] = useState("");
  const [newIpLabel, setNewIpLabel] = useState("");
  const [addingIp, setAddingIp] = useState(false);
  const [deletingIpId, setDeletingIpId] = useState<string | null>(null);
  const [togglingIpId, setTogglingIpId] = useState<string | null>(null);

  // ---- New Admin Form ----
  const [newAdminForm, setNewAdminForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin" as "super_admin" | "admin",
  });

  // ============================================================
  // DATA FETCHING
  // ============================================================

  const fetchCustomers = useCallback(async (searchQuery?: string) => {
    setCustomerSearching(!!searchQuery);
    try {
      const url = searchQuery
        ? `/api/admin/users?search=${encodeURIComponent(searchQuery)}`
        : "/api/admin/users";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      gooeyToast.error("Failed to retrieve customer accounts");
    } finally {
      setCustomersLoading(false);
      setCustomerSearching(false);
    }
  }, []);

  const fetchAdmins = useCallback(async () => {
    setAdminsSyncing(true);
    try {
      const res = await fetch("/api/admin/admins");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Normalize admin data to ensure ipWhitelists and _count exist
          const normalizedAdmins = (data.data || []).map((a: Record<string, unknown>) => ({
            ...a,
            ipWhitelists: a.ipWhitelists || [],
            _count: a._count || { activityLogs: 0 },
          }));
          setAdmins(normalizedAdmins);
        }
      }
    } catch (err) {
      console.error("Failed to fetch admins:", err);
      gooeyToast.error("Failed to retrieve administrator team");
    } finally {
      setAdminsLoading(false);
      setAdminsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchAdmins();
  }, [fetchCustomers, fetchAdmins]);

  // ============================================================
  // ACTIVITY LOG FETCHING
  // ============================================================

  const fetchActivityLogs = useCallback(async (adminId: string, page: number = 1) => {
    setActivityLoading(true);
    try {
      const res = await fetch(
        `/api/admin/admins/${adminId}/activity-logs?page=${page}&limit=20`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setActivityLogs(data.data.logs || []);
          setActivityTotalPages(data.data.pagination.totalPages);
          setActivityTotal(data.data.pagination.total);
        }
      }
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
      gooeyToast.error("Failed to load activity logs");
    } finally {
      setActivityLoading(false);
    }
  }, []);

  // ============================================================
  // IP WHITELIST FETCHING
  // ============================================================

  const fetchAdminIps = useCallback(async (adminId: string) => {
    setIpsLoading(true);
    try {
      const res = await fetch(`/api/admin/admins/${adminId}/ips`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAdminIps(data.data.ips || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch IP whitelist:", err);
      gooeyToast.error("Failed to load IP whitelist");
    } finally {
      setIpsLoading(false);
    }
  }, []);

  // ============================================================
  // ADMIN DETAIL HANDLERS
  // ============================================================

  const openAdminDetail = (admin: AdminUser) => {
    try {
      // Ensure ipWhitelists and _count are always arrays/objects
      const safeAdmin: AdminUser = {
        ...admin,
        ipWhitelists: admin.ipWhitelists || [],
        _count: admin._count || { activityLogs: 0 },
      };
      setSelectedAdmin(safeAdmin);
      setAdminDetailOpen(true);
      setAdminDetailTab("overview");
      setActivityPage(1);
      if (isSuperAdmin) {
        fetchActivityLogs(admin.id, 1);
        fetchAdminIps(admin.id);
      }
    } catch (err) {
      console.error("Error opening admin detail:", err);
    }
  };

  const handleAdminDetailTabChange = (tab: string) => {
    setAdminDetailTab(tab);
    if (selectedAdmin && tab === "activity" && isSuperAdmin) {
      fetchActivityLogs(selectedAdmin.id, 1);
    }
    if (selectedAdmin && tab === "ips" && isSuperAdmin) {
      fetchAdminIps(selectedAdmin.id);
    }
  };

  const handleActivityPageChange = (newPage: number) => {
    setActivityPage(newPage);
    if (selectedAdmin) {
      fetchActivityLogs(selectedAdmin.id, newPage);
    }
  };

  const handleAddIp = async () => {
    if (!selectedAdmin || !newIp.trim()) return;

    const ipRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(newIp.trim())) {
      gooeyToast.error("Invalid IPv4 address format");
      return;
    }

    setAddingIp(true);
    try {
      const res = await fetch(`/api/admin/admins/${selectedAdmin.id}/ips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ipAddress: newIp.trim(),
          label: newIpLabel.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        gooeyToast.success("IP address added to whitelist");
        setAdminIps([data.data, ...adminIps]);
        setNewIp("");
        setNewIpLabel("");
        setAdmins(
          admins.map((a) =>
            a.id === selectedAdmin.id
              ? { ...a, ipWhitelists: [data.data, ...(a.ipWhitelists || [])] }
              : a
          )
        );
      } else {
        gooeyToast.error(data.error || "Failed to add IP");
      }
    } catch {
      gooeyToast.error("Failed to add IP address");
    } finally {
      setAddingIp(false);
    }
  };

  const handleDeleteIp = async (ipId: string) => {
    if (!selectedAdmin) return;
    if (!confirm("Remove this IP from the whitelist? The admin may lose access if this is their current IP.")) {
      return;
    }

    setDeletingIpId(ipId);
    try {
      const res = await fetch(`/api/admin/admins/${selectedAdmin.id}/ips/${ipId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        gooeyToast.success("IP removed from whitelist");
        setAdminIps(adminIps.filter((ip) => ip.id !== ipId));
        setAdmins(
          admins.map((a) =>
            a.id === selectedAdmin.id
              ? { ...a, ipWhitelists: (a.ipWhitelists || []).filter((ip) => ip.id !== ipId) }
              : a
          )
        );
      } else {
        gooeyToast.error(data.error || "Failed to remove IP");
      }
    } catch {
      gooeyToast.error("Failed to remove IP address");
    } finally {
      setDeletingIpId(null);
    }
  };

  const handleToggleIpActive = async (ip: AdminIpEntry) => {
    if (!selectedAdmin) return;

    setTogglingIpId(ip.id);
    try {
      const res = await fetch(`/api/admin/admins/${selectedAdmin.id}/ips/${ip.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !ip.isActive }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAdminIps(
          adminIps.map((i) =>
            i.id === ip.id ? { ...i, isActive: !i.isActive } : i
          )
        );
      } else {
        gooeyToast.error(data.error || "Failed to toggle IP status");
      }
    } catch {
      gooeyToast.error("Failed to update IP status");
    } finally {
      setTogglingIpId(null);
    }
  };

  // ============================================================
  // CUSTOMER ACTIONS
  // ============================================================

  const handleCustomerSearch = () => {
    setCustomersLoading(true);
    setCustomerSearch(customerSearchInput);
    fetchCustomers(customerSearchInput);
  };

  const handleCustomerSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCustomerSearch();
  };

  const handleToggleCustomerActive = async (user: CustomerUser) => {
    setCustomerTogglingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (res.ok) {
        gooeyToast.success(`User ${!user.isActive ? "activated" : "deactivated"} successfully`);
        setCustomers(
          customers.map((c) =>
            c.id === user.id ? { ...c, isActive: !c.isActive } : c
          )
        );
        if (selectedCustomer?.id === user.id) {
          setSelectedCustomer({ ...selectedCustomer, isActive: !selectedCustomer.isActive });
        }
      } else {
        const data = await res.json();
        gooeyToast.error(data.error || "Failed to update user");
      }
    } catch {
      gooeyToast.error("Failed to update user");
    } finally {
      setCustomerTogglingId(null);
    }
  };

  // ============================================================
  // ADMIN ACTIONS
  // ============================================================

  const handleToggleAdminActive = async (adminUser: AdminUser) => {
    if (!isSuperAdmin) {
      gooeyToast.error("Super Admin privileges required");
      return;
    }
    setAdminTogglingId(adminUser.id);
    try {
      const res = await fetch(`/api/admin/admins/${adminUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !adminUser.isActive }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        gooeyToast.success("Administrator status changed");
        setAdmins(
          admins.map((a) =>
            a.id === adminUser.id ? { ...a, isActive: !a.isActive } : a
          )
        );
      } else {
        gooeyToast.error(data.error || "Failed to update administrator");
      }
    } catch {
      gooeyToast.error("An error occurred");
    } finally {
      setAdminTogglingId(null);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!isSuperAdmin) return;
    if (!confirm("Are you sure you want to delete this administrator? This action is irreversible.")) return;

    setAdminDeletingId(adminId);
    try {
      const res = await fetch(`/api/admin/admins/${adminId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        gooeyToast.success("Administrator deleted successfully");
        setAdmins(admins.filter((a) => a.id !== adminId));
      } else {
        gooeyToast.error(data.error || "Failed to delete administrator");
      }
    } catch {
      gooeyToast.error("An error occurred");
    } finally {
      setAdminDeletingId(null);
    }
  };

  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    if (!newAdminForm.name || !newAdminForm.email || !newAdminForm.password) {
      gooeyToast.error("Please fill in all fields");
      return;
    }
    if (newAdminForm.password.length < 8) {
      gooeyToast.error("Password must be at least 8 characters");
      return;
    }

    setAddAdminSaving(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAdminForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        gooeyToast.success("Administrator added successfully");
        setAdmins([{ ...data.data, ipWhitelists: [], _count: { activityLogs: 0 } }, ...admins]);
        setAddAdminDialogOpen(false);
        setNewAdminForm({ name: "", email: "", password: "", role: "admin" });
      } else {
        gooeyToast.error(data.error || "Failed to add administrator");
      }
    } catch {
      gooeyToast.error("An error occurred");
    } finally {
      setAddAdminSaving(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team & Users</h1>
          <p className="text-muted-foreground text-sm">
            Manage your customer database and team administrator roles.
          </p>
        </div>
      </div>

      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl mb-6">
          <TabsTrigger value="customers" className="rounded-lg py-1.5 px-4 text-sm font-medium">
            <Users className="size-4 mr-2" />
            Customers ({customers.length})
          </TabsTrigger>
          <TabsTrigger value="admins" className="rounded-lg py-1.5 px-4 text-sm font-medium">
            <ShieldCheck className="size-4 mr-2" />
            System Admins ({admins.length})
          </TabsTrigger>
        </TabsList>

        {/* ======================== CUSTOMERS TAB ======================== */}
        <TabsContent value="customers" className="outline-none space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search by customer name or email..."
                    value={customerSearchInput}
                    onChange={(e) => setCustomerSearchInput(e.target.value)}
                    onKeyDown={handleCustomerSearchKeyDown}
                  />
                </div>
                <Button onClick={handleCustomerSearch} disabled={customerSearching}>
                  {customerSearching ? (
                    <><Loader2 className="size-4 mr-2 animate-spin" />Searching...</>
                  ) : (
                    <><Search className="size-4 mr-2" />Search</>
                  )}
                </Button>
                {customerSearch && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCustomerSearchInput("");
                      setCustomerSearch("");
                      setCustomersLoading(true);
                      fetchCustomers();
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="size-5" /> Customer Accounts
              </CardTitle>
              <CardDescription>Registered portal users who book safari tours.</CardDescription>
            </CardHeader>
            <CardContent>
              {customersLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : customers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="size-10 mx-auto mb-3 opacity-50" />
                  <p>No customers found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="hidden md:table-cell">Phone</TableHead>
                        <TableHead className="hidden lg:table-cell">Country</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">Bookings</TableHead>
                        <TableHead className="hidden md:table-cell">Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <button
                              className="font-medium text-left hover:underline"
                              onClick={() => { setSelectedCustomer(user); setCustomerDialogOpen(true); }}
                            >
                              {user.name}
                            </button>
                          </TableCell>
                          <TableCell className="text-sm">{user.email}</TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {user.phone || "—"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                            {user.country || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                user.isActive
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : "bg-red-100 text-red-800 border-red-200"
                              }
                            >
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">{user.bookingsCount}</TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground font-mono">
                            {format(new Date(user.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleCustomerActive(user)}
                              disabled={customerTogglingId === user.id}
                            >
                              {customerTogglingId === user.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : user.isActive ? (
                                <ToggleRight className="size-4 text-emerald-500" />
                              ) : (
                                <ToggleLeft className="size-4 text-muted-foreground" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================== ADMINS TAB ======================== */}
        <TabsContent value="admins" className="outline-none space-y-6">
          {!isSuperAdmin && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm">
              <ShieldAlert className="size-5 shrink-0 text-amber-600" />
              <div>
                <span className="font-semibold">Standard Administrator:</span> Only{" "}
                <span className="font-semibold">Super Admin</span> can manage administrators, view activity logs, and configure IP access.
              </div>
            </div>
          )}

          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="size-5" /> System Administrators
                </CardTitle>
                <CardDescription>
                  Team members with admin credentials. Click a name to view activity logs and manage IP access.
                </CardDescription>
              </div>
              {isSuperAdmin && (
                <Button onClick={() => setAddAdminDialogOpen(true)} className="rounded-full bg-slate-900 text-white hover:bg-slate-800 shrink-0">
                  <UserPlus className="size-4 mr-2" /> Add Admin
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {adminsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : admins.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShieldCheck className="size-10 mx-auto mb-3 opacity-50" />
                  <p>No administrators registered</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">IP Restriction</TableHead>
                        <TableHead className="hidden md:table-cell">Activity</TableHead>
                        <TableHead className="hidden md:table-cell">Last Login</TableHead>
                        {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.map((adminItem) => {
                        const hasIpRestriction = (adminItem.ipWhitelists?.length || 0) > 0;
                        return (
                          <TableRow key={adminItem.id}>
                            <TableCell>
                              <button
                                className="font-medium text-left hover:underline text-slate-800"
                                onClick={() => openAdminDetail(adminItem)}
                              >
                                {adminItem.name}
                              </button>
                            </TableCell>
                            <TableCell className="text-sm">{adminItem.email}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  adminItem.role === "super_admin"
                                    ? "bg-amber-100 text-amber-800 border-amber-200"
                                    : "bg-slate-100 text-slate-800 border-slate-200"
                                }
                              >
                                {adminItem.role === "super_admin" ? "Super Admin" : "Admin"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  adminItem.isActive
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                    : "bg-red-100 text-red-800 border-red-200"
                                }
                              >
                                {adminItem.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {hasIpRestriction ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
                                  <Lock className="size-3" />
                                  {adminItem.ipWhitelists.length} IP{adminItem.ipWhitelists.length > 1 ? "s" : ""}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 gap-1">
                                  <Unlock className="size-3" />
                                  Open
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                              {adminItem._count?.activityLogs || 0} events
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs text-muted-foreground font-mono">
                              {adminItem.lastLoginAt
                                ? format(new Date(adminItem.lastLoginAt), "MMM d, h:mm a")
                                : "Never"}
                            </TableCell>
                            {isSuperAdmin && (
                              <TableCell className="text-right flex items-center justify-end gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                   disabled={adminTogglingId === adminItem.id || adminItem.id === (session?.user as { id?: string })?.id}
                                   onClick={() => handleToggleAdminActive(adminItem)}
                                   title={adminItem.id === (session?.user as { id?: string })?.id ? "Self protection" : "Toggle active state"}
                                >
                                  {adminTogglingId === adminItem.id ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : adminItem.isActive ? (
                                    <ToggleRight className="size-4 text-emerald-500" />
                                  ) : (
                                    <ToggleLeft className="size-4 text-muted-foreground" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                   disabled={adminDeletingId === adminItem.id || adminItem.id === (session?.user as { id?: string })?.id}
                                   onClick={() => handleDeleteAdmin(adminItem.id)}
                                   className="text-destructive hover:bg-destructive/10"
                                   title={adminItem.id === (session?.user as { id?: string })?.id ? "Self protection" : "Delete"}
                                >
                                  {adminDeletingId === adminItem.id ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="size-4 text-destructive" />
                                  )}
                                </Button>
                              </TableCell>
                            )}
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

      {/* ======================== CUSTOMER DETAIL DIALOG ======================== */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customer Profile Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary font-bold text-lg font-serif">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-lg">{selectedCustomer.name}</p>
                  <Badge
                    variant="outline"
                    className={
                      selectedCustomer.isActive
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-red-100 text-red-800 border-red-200"
                    }
                  >
                    {selectedCustomer.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="size-4 text-muted-foreground" />
                  <span>{selectedCustomer.email}</span>
                </div>
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="size-4 text-muted-foreground" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                )}
                {(selectedCustomer.country || selectedCustomer.city) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="size-4 text-muted-foreground" />
                    <span>{[selectedCustomer.city, selectedCustomer.country].filter(Boolean).join(", ")}</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">System Role</p>
                  <p className="text-sm font-medium capitalize">{selectedCustomer.role}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bookings</p>
                  <p className="text-sm font-medium">{selectedCustomer.bookingsCount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Joined Date</p>
                  <p className="text-sm font-medium font-mono">
                    {format(new Date(selectedCustomer.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">State Status</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Switch
                      checked={selectedCustomer.isActive}
                      onCheckedChange={() => handleToggleCustomerActive(selectedCustomer)}
                      disabled={customerTogglingId === selectedCustomer.id}
                    />
                    <span className="text-xs">{selectedCustomer.isActive ? "Active" : "Inactive"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ======================== ADMIN DETAIL DIALOG ======================== */}
      <Dialog open={adminDetailOpen} onOpenChange={setAdminDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <ShieldCheck className="size-5" />
              Administrator Details
            </DialogTitle>
          </DialogHeader>

          {selectedAdmin && (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Admin Summary Header */}
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="flex items-center justify-center size-14 rounded-full bg-slate-900 text-white font-bold text-xl font-serif">
                  {selectedAdmin.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg">{selectedAdmin.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedAdmin.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className={
                        selectedAdmin.role === "super_admin"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-slate-100 text-slate-800 border-slate-200"
                      }
                    >
                      {selectedAdmin.role === "super_admin" ? "Super Admin" : "Admin"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        selectedAdmin.isActive
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-red-100 text-red-800 border-red-200"
                      }
                    >
                      {selectedAdmin.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {(selectedAdmin.ipWhitelists?.length || 0) > 0 ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
                        <Lock className="size-3" /> IP Locked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 gap-1">
                        <Unlock className="size-3" /> Open Access
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs for Super Admin */}
              {isSuperAdmin && (
                <Tabs value={adminDetailTab} onValueChange={handleAdminDetailTabChange} className="flex-1 overflow-hidden flex flex-col mt-4">
                  <TabsList className="bg-slate-100 p-1 rounded-xl mb-4">
                    <TabsTrigger value="overview" className="rounded-lg text-xs px-3">
                      <Info className="size-3.5 mr-1.5" /> Overview
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="rounded-lg text-xs px-3">
                      <Activity className="size-3.5 mr-1.5" /> Activity Log
                    </TabsTrigger>
                    <TabsTrigger value="ips" className="rounded-lg text-xs px-3">
                      <Globe className="size-3.5 mr-1.5" /> IP Access
                    </TabsTrigger>
                  </TabsList>

                  {/* OVERVIEW TAB */}
                  <TabsContent value="overview" className="outline-none overflow-y-auto flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Email Address</p>
                        <p className="font-medium">{selectedAdmin.email}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">System Role</p>
                        <p className="font-medium capitalize">{selectedAdmin.role.replace("_", " ")}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Last Login</p>
                        <p className="font-medium font-mono">
                          {selectedAdmin.lastLoginAt
                            ? format(new Date(selectedAdmin.lastLoginAt), "MMM d, yyyy h:mm a")
                            : "Never logged in"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Created</p>
                        <p className="font-medium font-mono">
                          {format(new Date(selectedAdmin.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Total Activity Events</p>
                        <p className="font-medium">{selectedAdmin._count?.activityLogs || 0}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Whitelisted IPs</p>
                        <p className="font-medium">{selectedAdmin.ipWhitelists?.length || 0}</p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* ACTIVITY LOG TAB */}
                  <TabsContent value="activity" className="outline-none overflow-y-auto flex-1">
                    {activityLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} className="h-14 w-full" />
                        ))}
                      </div>
                    ) : activityLogs.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="size-10 mx-auto mb-3 opacity-50" />
                        <p>No activity recorded yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Showing {activityLogs.length} of {activityTotal} events</span>
                          <span>Page {activityPage} of {activityTotalPages}</span>
                        </div>
                        <div className="space-y-2">
                          {activityLogs.map((log) => {
                            const actionInfo = getActionInfo(log.action);
                            const props = parseProperties(log.properties);
                            return (
                              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                                <div className="shrink-0 mt-0.5">
                                  {log.action === "admin_login" || log.action === "admin_login_blocked_ip" ? (
                                    <div className={`p-1.5 rounded-lg ${log.action === "admin_login_blocked_ip" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
                                      {log.action === "admin_login_blocked_ip" ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
                                    </div>
                                  ) : log.action.includes("ip") ? (
                                    <div className="p-1.5 rounded-lg bg-cyan-100 text-cyan-600">
                                      <Globe className="size-3.5" />
                                    </div>
                                  ) : log.action.includes("password") ? (
                                    <div className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
                                      <Lock className="size-3.5" />
                                    </div>
                                  ) : (
                                    <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                                      <Activity className="size-3.5" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${actionInfo.color}`}>
                                      {actionInfo.label}
                                    </Badge>
                                    {log.ipAddress && (
                                      <span className="text-[10px] text-muted-foreground font-mono">
                                        {log.ipAddress}
                                      </span>
                                    )}
                                  </div>
                                  {Object.keys(props).length > 0 && (
                                    <div className="mt-1 text-xs text-muted-foreground">
                                      {Object.entries(props).map(([key, val]) => (
                                        <span key={key} className="mr-3">
                                          <span className="text-muted-foreground/70">{key}:</span>{" "}
                                          <span className="font-medium">{typeof val === "object" ? JSON.stringify(val) : String(val)}</span>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {log.userAgent && (
                                    <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground/60">
                                      <Monitor className="size-3" />
                                      <span className="truncate max-w-70">{log.userAgent}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="shrink-0 text-right">
                                  <p className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                                    {format(new Date(log.createdAt), "MMM d")}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground font-mono">
                                    {format(new Date(log.createdAt), "h:mm a")}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Pagination */}
                        {activityTotalPages > 1 && (
                          <div className="flex items-center justify-center gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={activityPage <= 1}
                              onClick={() => handleActivityPageChange(activityPage - 1)}
                            >
                              <ChevronLeft className="size-4" />
                            </Button>
                            <span className="text-xs text-muted-foreground px-3">
                              {activityPage} / {activityTotalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={activityPage >= activityTotalPages}
                              onClick={() => handleActivityPageChange(activityPage + 1)}
                            >
                              <ChevronRight className="size-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  {/* IP ACCESS TAB */}
                  <TabsContent value="ips" className="outline-none overflow-y-auto flex-1">
                    <div className="space-y-4">
                      {/* Add IP Form */}
                      <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Plus className="size-4" /> Add IP to Whitelist
                        </p>
                        <p className="text-xs text-muted-foreground">
                          When IP restriction is enabled, this admin can only log in from the listed IP addresses.
                          If no IPs are added, access is open from any location.
                        </p>
                        <div className="flex gap-2">
                          <Input
                            placeholder="192.168.1.1"
                            value={newIp}
                            onChange={(e) => setNewIp(e.target.value)}
                            disabled={addingIp}
                            className="font-mono text-sm"
                          />
                          <Input
                            placeholder="Label (optional)"
                            value={newIpLabel}
                            onChange={(e) => setNewIpLabel(e.target.value)}
                            disabled={addingIp}
                            className="text-sm w-36"
                          />
                          <Button
                            onClick={handleAddIp}
                            disabled={addingIp || !newIp.trim()}
                            className="shrink-0 bg-slate-900 text-white hover:bg-slate-800"
                          >
                            {addingIp ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Plus className="size-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* IP List */}
                      {ipsLoading ? (
                        <div className="space-y-2">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-14 w-full" />
                          ))}
                        </div>
                      ) : adminIps.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground border rounded-xl">
                          <Globe className="size-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No IP restrictions configured</p>
                          <p className="text-xs mt-1">Admin can access from any IP address</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {adminIps.map((ip) => (
                            <div
                              key={ip.id}
                              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                            >
                              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                                <Globe className="size-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-mono font-medium">{ip.ipAddress}</p>
                                {ip.label && (
                                  <p className="text-xs text-muted-foreground">{ip.label}</p>
                                )}
                                <p className="text-[10px] text-muted-foreground font-mono">
                                  Added {format(new Date(ip.createdAt), "MMM d, yyyy")}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Switch
                                  checked={ip.isActive}
                                  disabled={togglingIpId === ip.id}
                                  onCheckedChange={() => handleToggleIpActive(ip)}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={deletingIpId === ip.id}
                                  onClick={() => handleDeleteIp(ip.id)}
                                  className="text-destructive hover:bg-destructive/10"
                                >
                                  {deletingIpId === ip.id ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <X className="size-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {adminIps.length > 0 && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                          <Info className="size-4 shrink-0" />
                          <span>
                            This admin is restricted to {adminIps.filter((ip) => ip.isActive).length} active IP address(es).
                            Only enabled entries are enforced.
                          </span>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
              {!isSuperAdmin && (
                /* Non-super-admin: just show overview */
                <div className="mt-4 space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Last Login</p>
                      <p className="font-medium font-mono">
                        {selectedAdmin.lastLoginAt
                          ? format(new Date(selectedAdmin.lastLoginAt), "MMM d, yyyy h:mm a")
                          : "Never"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="font-medium font-mono">
                        {format(new Date(selectedAdmin.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                    <Eye className="size-3.5 inline mr-1" />
                    Activity logs and IP management are only available to Super Admins.
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ======================== ADD ADMIN DIALOG ======================== */}
      <Dialog open={addAdminDialogOpen} onOpenChange={setAddAdminDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Add New Administrator</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddAdminSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="admin-name">Full Name</Label>
              <Input
                id="admin-name"
                placeholder="Jane Doe"
                value={newAdminForm.name}
                onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                required
                disabled={addAdminSaving}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email Address</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="jane@journeytoafrica.com"
                value={newAdminForm.email}
                onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                required
                disabled={addAdminSaving}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Initial Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="At least 6 characters"
                value={newAdminForm.password}
                onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                required
                disabled={addAdminSaving}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-role">System Role</Label>
              <select
                id="admin-role"
                value={newAdminForm.role}
                onChange={(e) => setNewAdminForm({ ...newAdminForm, role: e.target.value as "super_admin" | "admin" })}
                disabled={addAdminSaving}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="admin">Standard Admin</option>
                <option value="super_admin">Super Admin (Can manage other admins)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddAdminDialogOpen(false)} disabled={addAdminSaving} className="rounded-full">
                Cancel
              </Button>
              <Button type="submit" disabled={addAdminSaving} className="rounded-full bg-slate-900 text-white hover:bg-slate-800">
                {addAdminSaving ? (
                  <><Loader2 className="size-4 mr-2 animate-spin" /> Adding...</>
                ) : (
                  <><UserPlus className="size-4 mr-2" /> Add Administrator</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
