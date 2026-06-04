"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { gooeyToast } from "@/components/admin/gooey-toast";
import { Key, Save, Loader2, Plus, Trash2, ArrowLeft, Copy, Check, ShieldAlert } from "lucide-react";
import Link from "next/link";

interface SystemConfig {
  id: string;
  key: string;
  value: string;
  label: string;
  description: string | null;
  type: string;
}

const PREDEFINED_KEYS = [
  { key: "paystack_secret_key", label: "Paystack Secret Key", description: "Secret key for Paystack API (starts with sk_)" },
  { key: "paystack_public_key", label: "Paystack Public Key", description: "Public key for Paystack API (starts with pk_)" },
  { key: "paystack_webhook_secret", label: "Paystack Webhook Secret", description: "Secret for verifying Paystack webhooks" },
  { key: "stripe_secret_key", label: "Stripe Secret Key", description: "Secret key for Stripe API (starts with sk_)" },
  { key: "stripe_public_key", label: "Stripe Public Key", description: "Public key for Stripe API (starts with pk_)" },
  { key: "stripe_webhook_secret", label: "Stripe Webhook Secret", description: "Secret for verifying Stripe webhooks" },
  { key: "smtp_host", label: "SMTP Host", description: "Outgoing mail server (e.g. smtp.mailtrap.io)" },
  { key: "smtp_port", label: "SMTP Port", description: "Port for SMTP (e.g. 587 or 465)" },
  { key: "smtp_user", label: "SMTP Username", description: "Username for mail server" },
  { key: "smtp_pass", label: "SMTP Password", description: "Password for mail server" },
  { key: "email_from", label: "Email From Address", description: "Sender email (e.g. info@yourdomain.com)" },
  { key: "cloudinary_cloud_name", label: "Cloudinary Cloud Name", description: "Your Cloudinary Cloud Name" },
  { key: "cloudinary_api_key", label: "Cloudinary API Key", description: "Your Cloudinary API Key" },
  { key: "cloudinary_api_secret", label: "Cloudinary API Secret", description: "Your Cloudinary API Secret" },
];

export default function ApiKeysPage() {
  const { data: session } = useSession();
  const activeUserRole = (session?.user as { role?: string })?.role || "admin";
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [activeGateway, setActiveGateway] = useState<string>("paystack");
  const [updatingGateway, setUpdatingGateway] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function fetchConfigs() {
    try {
      const res = await fetch("/api/admin/settings/configs");
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.data);
        
        // Find active payment gateway
        const gatewayConfig = data.data.find((c: { key: string; value: string }) => c.key === "active_payment_gateway");
        if (gatewayConfig) {
          setActiveGateway(gatewayConfig.value);
        }
      }
    } catch (err) {
      console.error("Failed to fetch configs:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleGatewayChange = async (value: string) => {
    setActiveGateway(value);
    setUpdatingGateway(true);
    try {
      const res = await fetch("/api/admin/settings/configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "active_payment_gateway",
          label: "Active Payment Gateway",
          description: "Choose which payment provider to use for bookings",
          value: value,
          type: "config",
          isEncrypted: false
        }),
      });

      if (res.ok) {
        gooeyToast.success(`Payment gateway switched to ${value}`);
        fetchConfigs();
      } else {
        gooeyToast.error("Failed to update payment gateway");
      }
    } catch {
      gooeyToast.error("Failed to update payment gateway");
    } finally {
      setUpdatingGateway(false);
    }
  };

  const handleSave = async () => {
    if (!selectedKey || !inputValue) {
      gooeyToast.error("Please select a key and enter a value");
      return;
    }

    const predefined = PREDEFINED_KEYS.find(k => k.key === selectedKey);
    if (!predefined) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: predefined.key,
          label: predefined.label,
          description: predefined.description,
          value: inputValue,
          type: "api_key"
        }),
      });

      if (res.ok) {
        gooeyToast.success("API Key saved successfully");
        setInputValue("");
        setSelectedKey("");
        fetchConfigs();
      } else {
        const data = await res.json();
        gooeyToast.error(data.error || "Failed to save API key");
      }
    } catch {
      gooeyToast.error("Failed to save API key");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (config: SystemConfig) => {
    setDeletingId(config.id);
    try {
      const res = await fetch(`/api/admin/settings/configs?id=${config.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        gooeyToast.success("API Key deleted");
        fetchConfigs();
      } else {
        gooeyToast.error("Failed to delete API key");
      }
    } catch {
      gooeyToast.error("Failed to delete API key");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = async (config: SystemConfig) => {
    try {
      await navigator.clipboard.writeText(config.key);
      setCopiedId(config.id);
      gooeyToast.success("Key copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      gooeyToast.error("Failed to copy");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (session && activeUserRole !== "super_admin") {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Card className="max-w-md w-full border-amber-200 bg-amber-50/50 shadow-md rounded-2xl">
          <CardHeader className="text-center">
            <ShieldAlert className="size-12 text-amber-600 mx-auto mb-3" />
            <CardTitle className="text-xl text-amber-900 font-serif">Super Admin Access Required</CardTitle>
            <CardDescription className="text-amber-800 text-sm mt-2 leading-relaxed">
              Managing payment credentials, SMTP credentials, and Cloudinary keys is restricted to **Super Administrators**.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button asChild className="rounded-full bg-slate-900 text-white hover:bg-slate-800 px-6">
              <Link href="/admin">
                <ArrowLeft className="size-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/settings">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Keys & Secrets</h1>
          <p className="text-muted-foreground">Manage your third-party integrations securely</p>
        </div>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Active Payment Gateway</CardTitle>
          <CardDescription>Select which payment gateway is active for customers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={activeGateway} onValueChange={handleGatewayChange} disabled={updatingGateway}>
              <SelectTrigger className="w-50 bg-white">
                <SelectValue placeholder="Select Gateway" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paystack">Paystack (Africa)</SelectItem>
                <SelectItem value="stripe">Stripe (International)</SelectItem>
              </SelectContent>
            </Select>
            {updatingGateway && <Loader2 className="size-4 animate-spin text-primary" />}
            <p className="text-sm text-muted-foreground">
              Current active gateway: <span className="font-bold uppercase text-primary">{activeGateway}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="size-5" />
              Add / Update Key
            </CardTitle>
            <CardDescription>Select a key type and enter its value. Values are stored encrypted.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Key Type</Label>
              <Select value={selectedKey} onValueChange={setSelectedKey}>
                <SelectTrigger>
                  <SelectValue placeholder="Select API Key" />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_KEYS.map((k) => (
                    <SelectItem key={k.key} value={k.key}>
                      {k.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedKey && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  {PREDEFINED_KEYS.find(k => k.key === selectedKey)?.description}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Key Value</Label>
              <Input
                type="password"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter key value"
              />
            </div>

            <Button className="w-full" onClick={handleSave} disabled={saving || !selectedKey || !inputValue}>
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="size-4 mr-2" />
                  Save API Key
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="size-5" />
              Stored Keys
            </CardTitle>
            <CardDescription>Currently configured API keys in the database.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {configs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No API keys stored yet.</p>
            ) : (
              <div className="space-y-4">
                {configs.map((config) => (
                  <div key={config.id} className="flex items-center justify-between p-3 rounded-lg border bg-slate-50">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-sm font-medium">{config.label}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{config.key}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleCopy(config)}
                        title="Copy key"
                      >
                        {copiedId === config.id ? (
                          <Check className="size-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(config)}
                        disabled={deletingId === config.id}
                        title="Delete key"
                      >
                        {deletingId === config.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
