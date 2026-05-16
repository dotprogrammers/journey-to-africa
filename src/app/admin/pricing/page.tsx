"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CreditCard, Pencil, Loader2, Users, Check, X } from "lucide-react";

interface PricingTier {
  id: string;
  name: string;
  subtitle: string | null;
  price: number;
  currency: string;
  maxCapacity: number;
  currentBookings: number;
  isEarlyBird: boolean;
  earlyBirdEndsAt: string | null;
  isActive: boolean;
  features: string | null;
  sortOrder: number;
  _count?: { bookings: number };
}

export default function PricingPage() {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTier, setEditTier] = useState<PricingTier | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    subtitle: "",
    price: 0,
    maxCapacity: 0,
    isEarlyBird: false,
    isActive: true,
    features: "",
    sortOrder: 0,
  });

  useEffect(() => {
    async function fetchTiers() {
      try {
        const res = await fetch("/api/admin/pricing");
        if (res.ok) {
          const data = await res.json();
          setTiers(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch tiers:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTiers();
  }, []);

  const handleEdit = (tier: PricingTier) => {
    setEditTier(tier);
    setFormData({
      name: tier.name,
      subtitle: tier.subtitle || "",
      price: tier.price,
      maxCapacity: tier.maxCapacity,
      isEarlyBird: tier.isEarlyBird,
      isActive: tier.isActive,
      features: tier.features || "",
      sortOrder: tier.sortOrder,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editTier) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pricing/${editTier.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Pricing tier updated successfully");
        const data = await res.json();
        setTiers(tiers.map((t) => (t.id === editTier.id ? data.data : t)));
        setDialogOpen(false);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update tier");
      }
    } catch {
      toast.error("Failed to update tier");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (tier: PricingTier) => {
    try {
      const res = await fetch(`/api/admin/pricing/${tier.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !tier.isActive }),
      });

      if (res.ok) {
        toast.success(`Tier ${!tier.isActive ? "activated" : "deactivated"}`);
        setTiers(tiers.map((t) => (t.id === tier.id ? { ...t, isActive: !t.isActive } : t)));
      } else {
        toast.error("Failed to toggle tier status");
      }
    } catch {
      toast.error("Failed to toggle tier status");
    }
  };

  const parseFeatures = (features: string | null): string[] => {
    if (!features) return [];
    try {
      return JSON.parse(features);
    } catch {
      return features.split("\n").filter(Boolean);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pricing Tiers</h1>
        <p className="text-muted-foreground">Manage pricing packages</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tiers.map((tier) => {
          const features = parseFeatures(tier.features);
          const capacityPercentage =
            tier.maxCapacity > 0
              ? Math.round((tier.currentBookings / tier.maxCapacity) * 100)
              : 0;

          return (
            <Card
              key={tier.id}
              className={`relative ${!tier.isActive ? "opacity-60" : ""}`}
            >
              {tier.isEarlyBird && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                    Early Bird
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="size-5" />
                  {tier.name}
                </CardTitle>
                {tier.subtitle && (
                  <CardDescription>{tier.subtitle}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl font-bold">
                    ${tier.price.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">{tier.currency} per person</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Users className="size-4" />
                      Capacity
                    </span>
                    <span>
                      {tier.currentBookings} / {tier.maxCapacity}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        capacityPercentage >= 90
                          ? "bg-red-500"
                          : capacityPercentage >= 70
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                      style={{ width: `${capacityPercentage}%` }}
                    />
                  </div>
                </div>

                {features.length > 0 && (
                  <div className="space-y-1">
                    {features.slice(0, 5).map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check className="size-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{feature}</span>
                      </div>
                    ))}
                    {features.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        +{features.length - 5} more features
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(tier)}
                  >
                    <Pencil className="size-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant={tier.isActive ? "secondary" : "default"}
                    size="sm"
                    onClick={() => handleToggleActive(tier)}
                  >
                    {tier.isActive ? (
                      <>
                        <X className="size-3.5 mr-1" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Check className="size-3.5 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Pricing Tier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Price (USD)</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max Capacity</Label>
                <Input
                  type="number"
                  value={formData.maxCapacity}
                  onChange={(e) =>
                    setFormData({ ...formData, maxCapacity: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Features (one per line)</Label>
              <Textarea
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                rows={5}
                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isEarlyBird}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isEarlyBird: checked })
                  }
                />
                <Label>Early Bird</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
