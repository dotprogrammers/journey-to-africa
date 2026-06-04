"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { gooeyToast } from "@/components/admin/gooey-toast";
import { Save, Loader2, Settings, Key } from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [groupedSettings, setGroupedSettings] = useState<GroupedSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        const grouped = data.data as GroupedSettings;
        setGroupedSettings(grouped);
        
        // Initialize edited values
        const values: Record<string, string> = {};
        Object.values(grouped)
          .flat()
          .forEach((s) => {
            values[s.key] = s.value;
          });
        setEditedValues(values);
        setHasChanges(false);

        const keys = Object.keys(grouped);
        if (keys.length > 0) {
          setActiveTab((prev) => prev || keys[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

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
        gooeyToast.success("Settings saved successfully");
        setHasChanges(false);
        router.refresh();
        await fetchSettings();
      } else {
        const data = await res.json();
        gooeyToast.error(data.error || "Failed to save settings");
      }
    } catch {
      gooeyToast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const renderSettingInput = (setting: SiteSetting) => {
    const value = editedValues[setting.key] ?? setting.value;

    const handleChange = (newValue: string) => {
      setEditedValues({ ...editedValues, [setting.key]: newValue });
      setHasChanges(true);
    };

    switch (setting.type) {
      case "boolean":
        return (
          <div className="flex items-center gap-3">
            <Switch
              checked={value === "true"}
              onCheckedChange={(checked) => {
                handleChange(checked ? "true" : "false");
              }}
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
            onChange={(e) => handleChange(e.target.value)}
            rows={4}
            placeholder={`Enter ${setting.label.toLowerCase()}`}
          />
        );
      case "json":
        return (
          <>
            <Textarea
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              rows={6}
              className="font-mono text-xs"
              placeholder="{}"
            />
            {value && (() => {
              try {
                JSON.parse(value);
                return null;
              } catch {
                return (
                  <p className="text-xs text-red-500 mt-1">
                    Invalid JSON format
                  </p>
                );
              }
            })()}
          </>
        );
      case "integer":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="0"
          />
        );
      case "file":
        return (
          <ImageUpload
            value={value}
            onChange={(url) => handleChange(url)}
          />
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleChange(e.target.value)}
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
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Save All{hasChanges ? " *" : ""}
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
