"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { gooeyToast } from "@/components/admin/gooey-toast";
import {
  Mail,
  Pencil,
  Loader2,
  Eye,
  Save,
  ArrowLeft,
  Variable,
} from "lucide-react";

interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
  availableVariables: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EmailsPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    subject: "",
    bodyHtml: "",
    isActive: true,
  });

  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch("/api/admin/emails");
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch templates:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setEditForm({
      subject: template.subject,
      bodyHtml: template.bodyHtml,
      isActive: template.isActive,
    });
  };

  const handleSave = async () => {
    if (!editingTemplate) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/emails/${editingTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        gooeyToast.success("Email template updated successfully");
        const data = await res.json();
        setTemplates(templates.map((t) => (t.id === editingTemplate.id ? data.data : t)));
        setEditingTemplate(null);
      } else {
        const data = await res.json();
        gooeyToast.error(data.error || "Failed to update template");
      }
    } catch {
      gooeyToast.error("Failed to update template");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = (template: EmailTemplate) => {
    // Simple preview: replace variables with sample data
    let html = template.bodyHtml;
    const sampleData: Record<string, string> = {
      "{{name}}": "John Doe",
      "{{email}}": "john@example.com",
      "{{booking_reference}}": "JTA-2026-0001",
      "{{tier_name}}": "Standard Package",
      "{{amount}}": "$3,500",
      "{{currency}}": "USD",
      "{{travelers}}": "2",
      "{{date}}": "June 15, 2026",
      "{{reason}}": "Schedule conflict",
    };

    Object.entries(sampleData).forEach(([key, value]) => {
      html = html.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
    });

    setPreviewHtml(html);
    setPreviewOpen(true);
  };

  const parseVariables = (vars: string | null): string[] => {
    if (!vars) return [];
    try {
      return JSON.parse(vars);
    } catch {
      return [];
    }
  };

  // If editing a template, show the editor view
  if (editingTemplate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setEditingTemplate(null)}>
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{editingTemplate.name}</h1>
              <p className="text-muted-foreground text-sm">
                <code className="bg-muted px-1.5 py-0.5 rounded">{editingTemplate.slug}</code>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handlePreview(editingTemplate)}
            >
              <Eye className="size-4 mr-1" />
              Preview
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 size-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Template Editor</CardTitle>
            <CardDescription>Edit the email template content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Subject Line</Label>
              <Input
                value={editForm.subject}
                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                placeholder="Email subject line"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={editForm.isActive}
                onCheckedChange={(checked) =>
                  setEditForm({ ...editForm, isActive: checked })
                }
              />
              <Label>Active</Label>
            </div>

            <div className="space-y-2">
              <Label>HTML Body</Label>
              <Textarea
                value={editForm.bodyHtml}
                onChange={(e) => setEditForm({ ...editForm, bodyHtml: e.target.value })}
                rows={20}
                className="font-mono text-xs"
                placeholder="<html>...</html>"
              />
            </div>

            {editingTemplate.availableVariables && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Variable className="size-4" />
                  Available Variables
                </Label>
                <div className="flex flex-wrap gap-2">
                  {parseVariables(editingTemplate.availableVariables).map((v) => (
                    <code
                      key={v}
                      className="text-xs bg-muted px-2 py-1 rounded cursor-pointer hover:bg-accent"
                      onClick={() => {
                        setEditForm({
                          ...editForm,
                          bodyHtml: editForm.bodyHtml + ` {{${v}}}`,
                        });
                      }}
                      title="Click to insert"
                    >
                      {`{{${v}}}`}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Email Preview</DialogTitle>
            </DialogHeader>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Email Templates</h1>
        <p className="text-muted-foreground">Manage email notification templates</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-5" />
            All Templates
          </CardTitle>
          <CardDescription>{templates.length} templates</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {template.slug}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {template.subject}
                    </TableCell>
                    <TableCell>
                      {template.isActive ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(template)}
                        >
                          <Eye className="size-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Pencil className="size-4 mr-1" />
                          Edit
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
    </div>
  );
}
