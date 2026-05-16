"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { toast } from "sonner";
import {
  Upload,
  Trash2,
  Pencil,
  ImageIcon,
  FileText,
  Film,
  Music,
  Loader2,
  X,
  Copy,
} from "lucide-react";
import { format } from "date-fns";
import { SmartImage } from "@/components/smart-image";

interface MediaFile {
  id: string;
  name: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  altText: string | null;
  collection: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editFile, setEditFile] = useState<MediaFile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteFile, setDeleteFile] = useState<MediaFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editAltText, setEditAltText] = useState("");
  const [editCollection, setEditCollection] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    try {
      const res = await fetch("/api/admin/media");
      if (res.ok) {
        const data = await res.json();
        setFiles(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch media files:", err);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchFiles(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (const file of Array.from(selectedFiles)) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/media", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} file${successCount > 1 ? "s" : ""} uploaded successfully`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} file${failCount > 1 ? "s" : ""} failed to upload`);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setUploading(false);
    fetchFiles();
  };

  const handleEdit = (file: MediaFile) => {
    setEditFile(file);
    setEditAltText(file.altText || "");
    setEditCollection(file.collection || "");
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editFile) return;
    try {
      const res = await fetch(`/api/admin/media/${editFile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          altText: editAltText,
          collection: editCollection,
        }),
      });

      if (res.ok) {
        toast.success("Media file updated");
        setEditDialogOpen(false);
        fetchFiles();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update file");
      }
    } catch {
      toast.error("Failed to update file");
    }
  };

  const handleDelete = async () => {
    if (!deleteFile) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/media/${deleteFile.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("File deleted successfully");
        setDeleteFile(null);
        fetchFiles();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete file");
      }
    } catch {
      toast.error("Failed to delete file");
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyPath = (filePath: string) => {
    navigator.clipboard.writeText(filePath);
    toast.success("File path copied to clipboard");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "image":
        return <ImageIcon className="size-8" />;
      case "video":
        return <Film className="size-8" />;
      case "audio":
        return <Music className="size-8" />;
      default:
        return <FileText className="size-8" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">
            Manage uploaded files and images ({files.length} file{files.length !== 1 ? "s" : ""})
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={handleUpload}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="size-4 mr-2" />
                Upload Files
              </>
            )}
          </Button>
        </div>
      </div>

      {files.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="size-12 mx-auto mb-3 opacity-50" />
              <h3 className="text-lg font-medium">No files uploaded yet</h3>
              <p className="text-sm mt-1">
                Click &quot;Upload Files&quot; to add images and documents
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {files.map((file) => (
            <Card
              key={file.id}
              className="group relative overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Preview */}
              <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
                {file.fileType === "image" ? (
                  <SmartImage
                    src={file.filePath}
                    alt={file.altText || file.name}
                    className="size-full object-cover"
                    fill
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    {getFileIcon(file.fileType)}
                    <span className="text-xs uppercase">{file.fileType}</span>
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="size-9"
                    onClick={() => handleEdit(file)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="size-9"
                    onClick={() => handleCopyPath(file.filePath)}
                    title="Copy file path"
                  >
                    <Copy className="size-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="size-9"
                    onClick={() => setDeleteFile(file)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              {/* File info */}
              <CardContent className="p-3">
                <p className="text-sm font-medium truncate" title={file.name}>
                  {file.name}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <Badge variant="outline" className="text-xs capitalize">
                    {file.fileType}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(file.fileSize)}
                  </span>
                </div>
                {file.altText && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {file.altText}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(file.createdAt), "MMM d, yyyy")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Media File</DialogTitle>
          </DialogHeader>
          {editFile && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {editFile.fileType === "image" ? (
                  <SmartImage
                    src={editFile.filePath}
                    alt={editFile.altText || editFile.name}
                    className="size-full object-cover"
                    fill
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    {getFileIcon(editFile.fileType)}
                    <span className="text-xs">{editFile.name}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>File Name</Label>
                <p className="text-sm text-muted-foreground">{editFile.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <p className="text-sm capitalize">{editFile.fileType}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Size</Label>
                  <p className="text-sm">{formatFileSize(editFile.fileSize)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Alt Text</Label>
                <Input
                  value={editAltText}
                  onChange={(e) => setEditAltText(e.target.value)}
                  placeholder="Describe this image for accessibility"
                />
              </div>

              <div className="space-y-2">
                <Label>Collection</Label>
                <Input
                  value={editCollection}
                  onChange={(e) => setEditCollection(e.target.value)}
                  placeholder="e.g., gallery, hero, team"
                />
              </div>

              <div className="space-y-2">
                <Label>File Path</Label>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                    {editFile.filePath}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    onClick={() => handleCopyPath(editFile.filePath)}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteFile} onOpenChange={(open) => !open && setDeleteFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteFile?.name}&quot;? This action cannot be undone.
              The file will be permanently removed from the server.
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
                  <Loader2 className="size-4 mr-2 animate-spin" />
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
