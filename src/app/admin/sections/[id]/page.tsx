"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { gooeyToast } from "@/components/admin/gooey-toast";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Pencil,
  GripVertical,
  ImageIcon,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { ImageUpload } from "@/components/admin/image-upload";
import { SmartImage } from "@/components/smart-image";
import {
  DndContext,
  closestCenter,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';

interface SortableItemProps {
  item: SectionItem;
  index: number;
  sectionSlug: string;
  onEdit: (item: SectionItem, index: number) => void;
  onRemove: (index: number) => void;
}

function SortableItem({ item, index, sectionSlug, onEdit, onRemove }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id || item.tempId || `item-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  if (["gallery_section", "inclusions_section"].includes(sectionSlug)) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="group relative aspect-square rounded-xl overflow-hidden border bg-card cursor-move shadow-sm hover:shadow-md transition-all"
      >
        <div className="absolute inset-0 z-0">
          {item.image ? (
            <SmartImage
              src={item.image || ''}
              fallbackType="section"
              alt={item.imageAlt || ""}
              className="size-full object-cover pointer-events-none"
              fill
            />
          ) : (
            <div className="size-full flex items-center justify-center bg-muted">
              <ImageIcon className="size-6 opacity-20" />
            </div>
          )}
        </div>

        {/* Title/Description overlay for Inclusions/Stats */}
        {["inclusions_section", "stats_section"].includes(sectionSlug) && (
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-end">
            <p className="text-white text-xs font-bold truncate">{item.title}</p>
            <p className="text-white/70 text-[10px] line-clamp-2">
              {sectionSlug === "stats_section" ? item.subtitle : (item.subtitle || item.description)}
            </p>
          </div>
        )}

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
          <Button
            variant="secondary"
            size="icon"
            className="size-8 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item, index);
            }}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="size-8 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
        <div className="absolute top-2 left-2 z-10 pointer-events-none">
          <Badge className="bg-white/90 text-black hover:bg-white/90 shadow-sm px-1.5 py-0 text-[10px]">
            {index + 1}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded">
        <GripVertical className="size-4 text-muted-foreground" />
      </div>

      <Badge variant="outline" className="shrink-0 text-[10px] uppercase font-bold tracking-wider">
        {item.itemType}
      </Badge>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">
          {item.title || "Untitled Item"}
        </p>
        {item.subtitle && (
          <p className="text-xs text-muted-foreground truncate font-medium">
            {item.subtitle}
          </p>
        )}
      </div>

      {item.image && (
        <div className="relative size-10 rounded-md bg-muted shrink-0 overflow-hidden border shadow-sm">
          <SmartImage
            src={item.image || ''}
            fallbackType="section"
            alt={item.imageAlt || ""}
            className="size-full object-cover"
            fill
          />
        </div>
      )}

      <div className="flex items-center gap-1 shrink-0 ml-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 hover:bg-white hover:shadow-sm"
          onClick={() => onEdit(item, index)}
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-destructive hover:bg-destructive/10"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

interface SectionItem {
  id?: string;
  tempId?: string; // Stable ID for DnD
  itemType: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  image: string | null;
  imageAlt: string | null;
  linkText: string | null;
  linkUrl: string | null;
  price: number | null;
  priceLabel: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface Section {
  id: string;
  slug: string;
  name: string;
  heading: string | null;
  subheading: string | null;
  description: string | null;
  label: string | null;
  backgroundImage: string | null;
  ctaPrimaryText: string | null;
  ctaPrimaryLink: string | null;
  ctaSecondaryText: string | null;
  ctaSecondaryLink: string | null;
  disclaimer: string | null;
  note: string | null;
  isActive: boolean;
  sortOrder: number;
  items: SectionItem[];
}

const emptyItem: SectionItem = {
  itemType: "feature",
  title: null,
  subtitle: null,
  description: null,
  image: null,
  imageAlt: null,
  linkText: null,
  linkUrl: null,
  price: null,
  priceLabel: null,
  sortOrder: 0,
  isActive: true,
};

const itemTypes = [
  { value: "feature", label: "Feature" },
  { value: "image", label: "Image" },
  { value: "tier", label: "Pricing Tier" },
  { value: "stat", label: "Statistic" },
  { value: "host", label: "Host" },
  { value: "link_group", label: "Link Group" },
  { value: "pillar", label: "Pillar" },
];

export default function SectionEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [editItem, setEditItem] = useState<SectionItem | null>(null);
  const [editItemIndex, setEditItemIndex] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    heading: "",
    subheading: "",
    description: "",
    label: "",
    backgroundImage: "",
    ctaPrimaryText: "",
    ctaPrimaryLink: "",
    ctaSecondaryText: "",
    ctaSecondaryLink: "",
    disclaimer: "",
    note: "",
    isActive: true,
  });
  const [items, setItems] = useState<SectionItem[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item, i) => (item.id || item.tempId || `item-${i}`) === active.id);
      const newIndex = items.findIndex((item, i) => (item.id || item.tempId || `item-${i}`) === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      const saveOrder = async () => {
        setSavingOrder(true);
        try {
          const payload = {
            ...formData,
            items: newItems.map((item: SectionItem, index: number) => ({
              ...item,
              sortOrder: index,
            })),
          };
          const res = await fetch(`/api/admin/sections/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            gooeyToast.success("Order updated");
          } else {
            gooeyToast.error("Failed to save order");
            setItems(items);
          }
        } catch {
          gooeyToast.error("Failed to save order");
          setItems(items);
        } finally {
          setSavingOrder(false);
        }
      };
      saveOrder();
    }
  };

  useEffect(() => {
    async function fetchSection() {
      try {
        const res = await fetch("/api/admin/sections");
        if (res.ok) {
          const data = await res.json();
          const found = data.data.find((s: Section) => s.id === id);
          if (found) {
            setSection(found);
            setFormData({
              heading: found.heading || "",
              subheading: found.subheading || "",
              description: found.description || "",
              label: found.label || "",
              backgroundImage: found.backgroundImage || "",
              ctaPrimaryText: found.ctaPrimaryText || "",
              ctaPrimaryLink: found.ctaPrimaryLink || "",
              ctaSecondaryText: found.ctaSecondaryText || "",
              ctaSecondaryLink: found.ctaSecondaryLink || "",
              disclaimer: found.disclaimer || "",
              note: found.note || "",
              isActive: found.isActive,
            });
            setItems(
              (found.items || [])
                .sort((a: SectionItem, b: SectionItem) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                .map((item: SectionItem) => ({ ...item, tempId: uuidv4() }))
            );
          }
        }
      } catch (err) {
        console.error("Failed to fetch section:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSection();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        items: items.map((item: SectionItem, index: number) => ({
          ...item,
          sortOrder: index,
        })),
      };

      const res = await fetch(`/api/admin/sections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        gooeyToast.success("Section saved successfully");
        const data = await res.json();
        if (data.data) {
          setItems(data.data.items || []);
        }
      } else {
        const data = await res.json();
        gooeyToast.error(data.error || "Failed to save section");
      }
    } catch {
      gooeyToast.error("Failed to save section");
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = () => {
    setEditItem({ ...emptyItem, sortOrder: items.length, tempId: uuidv4() });
    setEditItemIndex(null);
    setDialogOpen(true);
  };

  const handleEditItem = (item: SectionItem, index: number) => {
    setEditItem({ ...item });
    setEditItemIndex(index);
    setDialogOpen(true);
  };

  const handleSaveItem = () => {
    if (!editItem) return;

    let newItems = [...items];

    // Enforce only one active item for testimonials
    if (section?.slug === "testimonials_section" && editItem.isActive) {
      newItems = newItems.map((item: SectionItem) => ({ ...item, isActive: false }));
    }

    if (editItemIndex !== null) {
      newItems[editItemIndex] = editItem;
    } else {
      newItems.push(editItem);
    }

    setItems(newItems);
    setDialogOpen(false);
    setEditItem(null);
    setEditItemIndex(null);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!section) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Section not found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/admin/sections">Back to Sections</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/sections">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{section.name}</h1>
            <p className="text-muted-foreground text-sm">
              <code className="bg-muted px-1.5 py-0.5 rounded">{section.slug}</code>
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving || savingOrder}>
          {saving || savingOrder ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {savingOrder ? "Saving..." : "Saving..."}
            </>
          ) : (
            <>
              <Save className="mr-2 size-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Section Fields */}
      {section.slug !== "stats_section" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Section Content</CardTitle>
                <CardDescription>Edit the main content fields</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="isActive" className="text-sm">
                  Active
                </Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {section.slug !== "testimonials_section" && (
                <div className={["inclusions_section"].includes(section.slug) ? "space-y-2 sm:col-span-2" : "space-y-2"}>
                  <Label>Heading</Label>
                  <Input
                    value={formData.heading}
                    onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                    placeholder="Section heading"
                  />
                </div>
              )}
              {!["inclusions_section", "reserve_section", "not_included_section", "who_section", "host_section", "editorial_section", "testimonials_section"].includes(section.slug) && (
                <div className="space-y-2">
                  <Label>Subheading</Label>
                  <Input
                    value={formData.subheading}
                    onChange={(e) => setFormData({ ...formData, subheading: e.target.value })}
                    placeholder="Section subheading"
                  />
                </div>
              )}
            </div>

            {/* Conditionally hide Description */}
            {!["pillars_section", "gallery_section", "inclusions_section", "host_section"].includes(section.slug) && (
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Section description"
                  rows={3}
                />
              </div>
            )}

            {/* Conditionally hide Label/Background Image for specific sections */}
            <div className="grid gap-4 sm:grid-cols-2">
              {!["pillars_section", "gallery_section", "inclusions_section", "reserve_section", "not_included_section", "who_section", "host_section", "editorial_section", "testimonials_section"].includes(section.slug) && (
                <div className={section.slug === "philosophy_section" ? "space-y-2 sm:col-span-2" : "space-y-2"}>
                  <Label>Label</Label>
                  <Input
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="Section label"
                  />
                </div>
              )}
              {!["philosophy_section", "pillars_section", "gallery_section", "inclusions_section", "reserve_section", "not_included_section", "who_section", "host_section", "editorial_section", "testimonials_section"].includes(section.slug) && (
                <div className="space-y-2">
                  <ImageUpload
                    label="Background Image"
                    value={formData.backgroundImage}
                    onChange={(url) => setFormData({ ...formData, backgroundImage: url })}
                  />
                </div>
              )}
            </div>

            {!["philosophy_section", "pillars_section", "gallery_section", "inclusions_section", "not_included_section", "who_section", "host_section", "editorial_section", "testimonials_section"].includes(section.slug) && (
              <>
                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>CTA Primary Text</Label>
                    <Input
                      value={formData.ctaPrimaryText}
                      onChange={(e) => setFormData({ ...formData, ctaPrimaryText: e.target.value })}
                      placeholder="Book Now"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA Primary Link</Label>
                    <Input
                      value={formData.ctaPrimaryLink}
                      onChange={(e) => setFormData({ ...formData, ctaPrimaryLink: e.target.value })}
                      placeholder="/booking"
                    />
                  </div>
                </div>

                {section.slug !== "reserve_section" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>CTA Secondary Text</Label>
                      <Input
                        value={formData.ctaSecondaryText}
                        onChange={(e) =>
                          setFormData({ ...formData, ctaSecondaryText: e.target.value })
                        }
                        placeholder="Learn More"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CTA Secondary Link</Label>
                      <Input
                        value={formData.ctaSecondaryLink}
                        onChange={(e) =>
                          setFormData({ ...formData, ctaSecondaryLink: e.target.value })
                        }
                        placeholder="/about"
                      />
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  {section.slug !== "reserve_section" && (
                    <div className="space-y-2">
                      <Label>Disclaimer</Label>
                      <Textarea
                        value={formData.disclaimer}
                        onChange={(e) => setFormData({ ...formData, disclaimer: e.target.value })}
                        placeholder="Disclaimer text"
                        rows={2}
                      />
                    </div>
                  )}
                  <div className={section.slug === "reserve_section" ? "space-y-2 sm:col-span-2" : "space-y-2"}>
                    <Label>Note</Label>
                    <Textarea
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      placeholder="Additional notes"
                      rows={2}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section Items */}
      {!["reserve_section", "not_included_section", "who_section", "editorial_section"].includes(section.slug) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Section Items
                  {savingOrder && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                </CardTitle>
                <CardDescription>Manage the items within this section</CardDescription>
              </div>
              <Button size="sm" onClick={handleAddItem}>
                <Plus className="size-4 mr-1" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="size-10 mx-auto mb-2 opacity-50" />
                <p>No items yet. Click &quot;Add Item&quot; to create one.</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={items.map((item: SectionItem, i: number) => item.id || item.tempId || `item-${i}`)}
                  strategy={["gallery_section", "inclusions_section", "stats_section"].includes(section.slug) ? rectSortingStrategy : verticalListSortingStrategy}
                >
                  <div className={["gallery_section", "inclusions_section", "stats_section"].includes(section.slug)
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                    : "space-y-2"
                  }>
                    {items.map((item: SectionItem, index: number) => (
                      <SortableItem
                        key={item.id || `item-${index}`}
                        item={item}
                        index={index}
                        sectionSlug={section.slug}
                        onEdit={handleEditItem}
                        onRemove={handleRemoveItem}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>
      )}

      {/* Item Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editItemIndex !== null ? "Edit Item" : "Add Item"}
            </DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {section.slug !== "testimonials_section" && (
                  <div className="space-y-2">
                    <Label>Item Type</Label>
                    <Select
                      value={editItem.itemType}
                      onValueChange={(value) =>
                        setEditItem({ ...editItem, itemType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {itemTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2 flex items-end pb-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editItem.isActive}
                      onCheckedChange={(checked) =>
                        setEditItem({ ...editItem, isActive: checked })
                      }
                    />
                    <Label>Active</Label>
                  </div>
                </div>
              </div>

              {!["gallery_section", "inclusions_section", "stats_section", "testimonials_section"].includes(section.slug) && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className={section.slug === "host_section" ? "space-y-2 sm:col-span-2" : "space-y-2"}>
                      <Label>Title</Label>
                      <Input
                        value={editItem.title || ""}
                        onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                        placeholder="Item title"
                      />
                    </div>
                    {section.slug !== "host_section" && (
                      <div className="space-y-2">
                        <Label>Subtitle</Label>
                        <Input
                          value={editItem.subtitle || ""}
                          onChange={(e) => setEditItem({ ...editItem, subtitle: e.target.value })}
                          placeholder="Item subtitle"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={editItem.description || ""}
                      onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                      placeholder="Item description"
                      rows={3}
                    />
                  </div>
                </>
              )}

              {section.slug === "stats_section" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Title (Value)</Label>
                    <Input
                      value={editItem.title || ""}
                      onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                      placeholder="e.g. 98%"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtitle (Label)</Label>
                    <Input
                      value={editItem.subtitle || ""}
                      onChange={(e) => setEditItem({ ...editItem, subtitle: e.target.value })}
                      placeholder="e.g. Satisfaction"
                    />
                  </div>
                </div>
              )}

              {section.slug === "inclusions_section" && (
                <>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={editItem.title || ""}
                      onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                      placeholder="Item title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={editItem.description || ""}
                      onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                      placeholder="Item description"
                      rows={3}
                    />
                  </div>
                </>
              )}

              {!["stats_section", "host_section", "testimonials_section"].includes(section.slug) && (
                <div className="space-y-4">
                  <ImageUpload
                    label="Image"
                    value={editItem.image || ""}
                    onChange={(url) => setEditItem({ ...editItem, image: url })}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Image Alt Text</Label>
                      <Input
                        value={editItem.imageAlt || ""}
                        onChange={(e) => setEditItem({ ...editItem, imageAlt: e.target.value })}
                        placeholder="Image description"
                      />
                    </div>
                    {section.slug !== "testimonials_section" && (
                      <div className="space-y-2">
                        <Label>Sort Order</Label>
                        <Input
                          type="number"
                          value={editItem.sortOrder}
                          onChange={(e) => setEditItem({ ...editItem, sortOrder: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {section.slug === "testimonials_section" && (
                <div className="space-y-4">
                  <ImageUpload
                    label="Image"
                    value={editItem.image || ""}
                    onChange={(url) => setEditItem({ ...editItem, image: url })}
                  />
                  <div className="space-y-2">
                    <Label>Image Alt Text</Label>
                    <Input
                      value={editItem.imageAlt || ""}
                      onChange={(e) => setEditItem({ ...editItem, imageAlt: e.target.value })}
                      placeholder="Image description"
                    />
                  </div>
                </div>
              )}

              {section.slug === "host_section" && (
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={editItem.sortOrder}
                    onChange={(e) => setEditItem({ ...editItem, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
              )}

              {section.slug === "stats_section" && (
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={editItem.sortOrder}
                    onChange={(e) => setEditItem({ ...editItem, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
              )}

              {/* Hero Section Specific Options */}
              {section.slug === "hero_section" && editItem.itemType === "image" && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4 mt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Layout Configuration</p>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Direction</Label>
                      <Select
                        value={editItem.subtitle || "right"}
                        onValueChange={(value) => setEditItem({ ...editItem, subtitle: value })}
                      >
                        <SelectTrigger className="h-9 bg-white">
                          <SelectValue placeholder="Side" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Span (Height)</Label>
                      <Select
                        value={editItem.linkText || "1"}
                        onValueChange={(value) => setEditItem({ ...editItem, linkText: value })}
                      >
                        <SelectTrigger className="h-9 bg-white">
                          <SelectValue placeholder="Span" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1x (Small)</SelectItem>
                          <SelectItem value="2">2x (Large)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Order</Label>
                      <Input
                        type="number"
                        className="h-9 bg-white"
                        value={editItem.sortOrder}
                        onChange={(e) => setEditItem({ ...editItem, sortOrder: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Only show these fields if NOT a hero image AND NOT a gallery/inclusion/stat/host/testimonial item */}
              {!(section.slug === "hero_section" && editItem.itemType === "image") && !["gallery_section", "inclusions_section", "stats_section", "host_section", "testimonials_section"].includes(section.slug) && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Link Text</Label>
                      <Input
                        value={editItem.linkText || ""}
                        onChange={(e) => setEditItem({ ...editItem, linkText: e.target.value })}
                        placeholder="Learn More"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Link URL</Label>
                      <Input
                        value={editItem.linkUrl || ""}
                        onChange={(e) => setEditItem({ ...editItem, linkUrl: e.target.value })}
                        placeholder="/page"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Price</Label>
                      <Input
                        type="number"
                        value={editItem.price || 0}
                        onChange={(e) => setEditItem({ ...editItem, price: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price Label</Label>
                      <Input
                        value={editItem.priceLabel || ""}
                        onChange={(e) => setEditItem({ ...editItem, priceLabel: e.target.value })}
                        placeholder="per person"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveItem}>Save Item</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
