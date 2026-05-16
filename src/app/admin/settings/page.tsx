"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Save, Loader2, Settings, Key } from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";
import Link from "next/link";

interface SiteSetting {
  id: string;
  group: string;
  key: string;
  value: string;
  type: string;
  label: string;
  description: string | null;
  sortOrder: number;
}

type GroupedSettings = Record<string, SiteSetting[]>;

export default function SettingsPage() {
  const [groupedSettings, setGroupedSettings] = useState<GroupedSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          const grouped = data.data as GroupedSettings;
          setGroupedSettings(grouped);
          const keys = Object.keys(grouped);
          if (keys.length > 0) {
            setActiveTab(keys[0]);
          }
          // Initialize edited values
          const values: Record<string, string> = {};
          Object.values(grouped)
            .flat()
            .forEach((s) => {
              values[s.key] = s.value;
            });
          setEditedValues(values);
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings = Object.entries(editedValues).map(([key, value]) => ({
        key,
        value,
      }));

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (res.ok) {
        toast.success("Settings saved successfully");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save settings");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const renderSettingInput = (setting: SiteSetting) => {
    const value = editedValues[setting.key] ?? setting.value;

    switch (setting.type) {
      case "boolean":
        return (
          <div className="flex items-center gap-3">
            <Switch
              checked={value === "true"}
              onCheckedChange={(checked) =>
                setEditedValues({ ...editedValues, [setting.key]: checked ? "true" : "false" })
              }
            />
            <span className="text-sm text-muted-foreground">
              {value === "true" ? "Enabled" : "Disabled"}
            </span>
          </div>
        );
      case "text":
        return (
          <Textarea
            value={value}
            onChange={(e) =>
              setEditedValues({ ...editedValues, [setting.key]: e.target.value })
            }
            rows={4}
            placeholder={`Enter ${setting.label.toLowerCase()}`}
          />
        );
      case "json":
        return (
          <Textarea
            value={value}
            onChange={(e) =>
              setEditedValues({ ...editedValues, [setting.key]: e.target.value })
            }
            rows={6}
            className="font-mono text-xs"
            placeholder="{}"
          />
        );
      case "integer":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) =>
              setEditedValues({ ...editedValues, [setting.key]: e.target.value })
            }
            placeholder="0"
          />
        );
      case "file":
        return (
          <ImageUpload
            value={value}
            onChange={(url) => setEditedValues({ ...editedValues, [setting.key]: url })}
          />
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) =>
              setEditedValues({ ...editedValues, [setting.key]: e.target.value })
            }
            placeholder={`Enter ${setting.label.toLowerCase()}`}
          />
        );
    }
  };

  const groupLabels: Record<string, string> = {
    general: "General",
    seo: "SEO",
    appearance: "Appearance",
    contact: "Contact",
    social: "Social",
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Site Settings</h1>
          <p className="text-muted-foreground">Manage your site configuration</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/admin/settings/api-keys">
              <Key className="size-4 mr-2" />
              API Keys & Secrets
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="size-4" />
                Save All
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          {Object.keys(groupedSettings).map((group) => (
            <TabsTrigger key={group} value={group}>
              {groupLabels[group] || group}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(groupedSettings).map(([group, settings]) => (
          <TabsContent key={group} value={group} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="size-5" />
                  {groupLabels[group] || group} Settings
                </CardTitle>
                <CardDescription>
                  Configure {groupLabels[group]?.toLowerCase() || group} settings for your site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings.map((setting) => (
                  <div key={setting.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{setting.label}</Label>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {setting.type}
                      </code>
                    </div>
                    {setting.description && (
                      <p className="text-xs text-muted-foreground">{setting.description}</p>
                    )}
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
