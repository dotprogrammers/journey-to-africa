"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { gooeyToast } from "@/components/admin/gooey-toast";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Layout,
  GripVertical,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Monitor,
} from "lucide-react";

interface Section {
  id: string;
  slug: string;
  name: string;
  heading: string | null;
  isActive: boolean;
  sortOrder: number;
  items: Array<{ id: string }>;
}

function SortableSectionRow({
  section,
  index,
  onToggle,
  disabled,
}: {
  section: Section;
  index: number;
  onToggle: (section: Section) => void;
  disabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 rounded-lg border bg-card ${
        isDragging ? "shadow-lg border-primary" : ""
      } ${!section.isActive ? "opacity-60" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="size-5 text-muted-foreground" />
      </div>

      <div className="flex items-center justify-center size-8 rounded-md bg-muted shrink-0">
        <span className="text-sm font-bold text-muted-foreground">{index + 1}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{section.name}</p>
        <p className="text-xs text-muted-foreground font-mono">{section.slug}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className="text-xs">
          {section.items.length} items
        </Badge>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {section.isActive ? (
          <Eye className="size-4 text-emerald-500" />
        ) : (
          <EyeOff className="size-4 text-muted-foreground" />
        )}
        <Switch
          checked={section.isActive}
          onCheckedChange={() => onToggle(section)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

export default function LandingPageManager() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const fetchSections = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/sections");
      if (res.ok) {
        const data = await res.json();
        setSections(
          (data.data || []).sort((a: Section, b: Section) => a.sortOrder - b.sortOrder)
        );
      } else {
        gooeyToast.error("Failed to fetch sections");
      }
    } catch {
      gooeyToast.error("Failed to fetch sections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      const newSections = arrayMove(sections, oldIndex, newIndex);
      setSections(newSections);
    }
  };

  const handleToggle = async (section: Section) => {
    setTogglingId(section.id);
    try {
      const res = await fetch(`/api/admin/sections/${section.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !section.isActive }),
      });

      if (res.ok) {
        gooeyToast.success(
          `${section.name} ${!section.isActive ? "enabled" : "disabled"} on landing page`
        );
        fetchSections();
      } else {
        gooeyToast.error("Failed to update section");
      }
    } catch {
      gooeyToast.error("Failed to update section");
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    try {
      const updates = sections.map((section, index) =>
        fetch(`/api/admin/sections/${section.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: index }),
        })
      );

      const results = await Promise.all(updates);
      const allOk = results.every((r) => r.ok);

      if (allOk) {
        gooeyToast.success("Section order saved successfully");
      } else {
        gooeyToast.error("Failed to save some sections");
      }
    } catch {
      gooeyToast.error("Failed to save order");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-32" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const activeCount = sections.filter((s) => s.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Landing Page Manager</h1>
          <p className="text-muted-foreground">
            Control which sections appear on the homepage and their order
          </p>
        </div>
        <Button onClick={handleSaveOrder} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="size-4 mr-1" />
              Save Order
            </>
          )}
        </Button>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Monitor className="size-5" />
            Landing Page Preview
          </CardTitle>
          <CardDescription>
            {activeCount} of {sections.length} sections are visible on the landing page.
            Drag to reorder, toggle switches to show/hide.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="size-5" />
            Section Order
          </CardTitle>
          <CardDescription>
            Drag and drop to reorder sections. The order here determines how they appear on the landing page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {sections.map((section, index) => (
                  <SortableSectionRow
                    key={section.id}
                    section={section}
                    index={index}
                    onToggle={handleToggle}
                    disabled={togglingId === section.id}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {sections.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Layout className="size-10 mx-auto mb-2 opacity-50" />
              <p>No sections found</p>
              <p className="text-sm mt-1">Create sections in the Sections page first</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Section Status Overview</CardTitle>
          <CardDescription>Quick overview of all sections and their visibility</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((section) => (
              <div
                key={section.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  section.isActive ? "bg-emerald-50/50 border-emerald-200" : "bg-muted/50"
                }`}
              >
                <div
                  className={`size-2 rounded-full ${
                    section.isActive ? "bg-emerald-500" : "bg-muted-foreground/30"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{section.name}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {section.slug}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    section.isActive
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : ""
                  }`}
                >
                  {section.isActive ? "Visible" : "Hidden"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
