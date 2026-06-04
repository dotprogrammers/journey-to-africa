"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Layers, Plus, Trash2, Loader2 } from "lucide-react";
import { gooeyToast } from "@/components/admin/gooey-toast";

interface Section {
  id: string;
  slug: string;
  name: string;
  heading: string | null;
  isActive: boolean;
  sortOrder: number;
  items: Array<{ id: string; itemType: string; title: string | null }>;
  updatedAt: string;
}

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteSection, setDeleteSection] = useState<Section | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSection, setNewSection] = useState({ name: "", slug: "" });

  useEffect(() => {
    fetchSections();
  }, []);

  async function fetchSections() {
    try {
      const res = await fetch("/api/admin/sections");
      if (res.ok) {
        const data = await res.json();
        setSections(data.data);
      } else {
        gooeyToast.error("Failed to fetch sections");
      }
    } catch (err) {
      console.error("Failed to fetch sections:", err);
      gooeyToast.error("Failed to fetch sections");
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async () => {
    if (!newSection.name || !newSection.slug) {
      gooeyToast.error("Name and slug are required");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSection.name,
          slug: newSection.slug,
          isActive: true,
          sortOrder: sections.length,
        }),
      });

      if (res.ok) {
        gooeyToast.success("Section created successfully");
        setCreateDialogOpen(false);
        setNewSection({ name: "", slug: "" });
        fetchSections();
      } else {
        const data = await res.json();
        gooeyToast.error(data.error || "Failed to create section");
      }
    } catch {
      gooeyToast.error("Failed to create section");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteSection) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/sections/${deleteSection.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        gooeyToast.success("Section deleted successfully");
        setDeleteSection(null);
        fetchSections();
      } else {
        const data = await res.json();
        gooeyToast.error(data.error || "Failed to delete section");
      }
    } catch {
      gooeyToast.error("Failed to delete section");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (section: Section) => {
    try {
      const res = await fetch(`/api/admin/sections/${section.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !section.isActive }),
      });

      if (res.ok) {
        gooeyToast.success(`Section ${!section.isActive ? "activated" : "deactivated"}`);
        fetchSections();
      } else {
        gooeyToast.error("Failed to update section");
      }
    } catch {
      gooeyToast.error("Failed to update section");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sections</h1>
          <p className="text-muted-foreground">Manage CMS content sections</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="size-4 mr-1" />
          Add Section
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="size-5" />
            All Sections
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : sections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Layers className="size-10 mx-auto mb-2 opacity-50" />
              <p>No sections found</p>
              <Button variant="outline" className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="size-4 mr-1" />
                Create your first section
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sections.map((section) => (
                  <TableRow key={section.id}>
                    <TableCell className="font-medium">{section.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {section.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleActive(section)}
                        className="cursor-pointer"
                      >
                        {section.isActive ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </button>
                    </TableCell>
                    <TableCell>{section.items.length} items</TableCell>
                    <TableCell>{section.sortOrder}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/sections/${section.id}`}>
                            <Pencil className="size-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteSection(section)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Section Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newSection.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setNewSection({
                    ...newSection,
                    name,
                    slug: name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
                  });
                }}
                placeholder="e.g. Hero Section"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={newSection.slug}
                onChange={(e) => setNewSection({ ...newSection, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                placeholder="e.g. hero_section"
              />
              <p className="text-xs text-muted-foreground">
                Used to identify the section in the CMS API
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating || !newSection.name || !newSection.slug}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Section"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteSection} onOpenChange={(open) => !open && setDeleteSection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteSection?.name}&quot;? This will also delete all items within this section. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
