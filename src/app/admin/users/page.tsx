"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
import { toast } from "sonner";
import {
  Users,
  Search,
  Loader2,
  Mail,
  Phone,
  MapPin,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { format } from "date-fns";

interface User {
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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchUsers = useCallback(async (searchQuery?: string) => {
    try {
      const url = searchQuery
        ? `/api/admin/users?search=${encodeURIComponent(searchQuery)}`
        : "/api/admin/users";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = () => {
    setLoading(true);
    setSearch(searchInput);
    fetchUsers(searchInput);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleToggleActive = async (user: User) => {
    setTogglingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (res.ok) {
        toast.success(`User ${!user.isActive ? "activated" : "deactivated"} successfully`);
        setUsers(
          users.map((u) =>
            u.id === user.id ? { ...u, isActive: !u.isActive } : u
          )
        );
        if (selectedUser?.id === user.id) {
          setSelectedUser({ ...selectedUser, isActive: !selectedUser.isActive });
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update user");
      }
    } catch {
      toast.error("Failed to update user");
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-96" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage registered users ({users.length} total)
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="size-4 mr-1" />
              Search
            </Button>
            {search && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setLoading(true);
                  fetchUsers();
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            All Users
          </CardTitle>
          <CardDescription>
            {users.length} user{users.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="size-10 mx-auto mb-3 opacity-50" />
              <p>No users found</p>
              {search && (
                <p className="text-sm mt-1">
                  Try a different search term
                </p>
              )}
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
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Bookings</TableHead>
                    <TableHead className="hidden md:table-cell">Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <button
                          className="font-medium text-left hover:underline"
                          onClick={() => {
                            setSelectedUser(user);
                            setDialogOpen(true);
                          }}
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
                            user.role === "admin"
                              ? "bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-100"
                              : "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-100"
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            user.isActive
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                              : "bg-red-100 text-red-800 border-red-200 hover:bg-red-100"
                          }
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {user.bookingsCount}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(user)}
                          disabled={togglingId === user.id}
                          title={user.isActive ? "Deactivate user" : "Activate user"}
                        >
                          {togglingId === user.id ? (
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

      {/* User Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary font-bold text-lg">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-lg">{selectedUser.name}</p>
                  <Badge
                    variant="outline"
                    className={
                      selectedUser.isActive
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-red-100 text-red-800 border-red-200"
                    }
                  >
                    {selectedUser.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="size-4 text-muted-foreground" />
                  <span>{selectedUser.email}</span>
                </div>
                {selectedUser.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="size-4 text-muted-foreground" />
                    <span>{selectedUser.phone}</span>
                  </div>
                )}
                {(selectedUser.country || selectedUser.city) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="size-4 text-muted-foreground" />
                    <span>
                      {[selectedUser.city, selectedUser.country]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="text-sm font-medium capitalize">{selectedUser.role}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bookings</p>
                  <p className="text-sm font-medium">{selectedUser.bookingsCount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Joined</p>
                  <p className="text-sm font-medium">
                    {format(new Date(selectedUser.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Switch
                      checked={selectedUser.isActive}
                      onCheckedChange={() => {
                        handleToggleActive(selectedUser);
                      }}
                      disabled={togglingId === selectedUser.id}
                    />
                    <span className="text-sm">
                      {selectedUser.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
