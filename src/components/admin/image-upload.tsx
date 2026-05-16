"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Upload, 
  X, 
  Loader2, 
  ImageIcon, 
  Library,
  Search,
  Check
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { SmartImage } from "@/components/smart-image";

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  description?: string;
}

interface MediaFile {
  id: string;
  name: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  altText: string | null;
  collection: string | null;
}

export function ImageUpload({ value, onChange, label, description }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [browsing, setBrowsing] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onChange(data.data.filePath);
        toast.success("Image uploaded successfully");
      } else {
        const data = await res.json();
        toast.error(data.error || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const fetchMedia = async () => {
    setLoadingMedia(true);
    setBrowsing(true);
    try {
      const res = await fetch("/api/admin/media");
      if (res.ok) {
        const data = await res.json();
        setMediaFiles(data.data.filter((f: MediaFile) => f.fileType === "image"));
      }
    } catch (err) {
      console.error("Failed to fetch media:", err);
      toast.error("Failed to load media library");
    } finally {
      setLoadingMedia(false);
    }
  };

  const filteredMedia = mediaFiles.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.collection && f.collection.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      
      <div className="flex flex-col gap-4">
        {value ? (
          <div className="relative aspect-video w-full max-w-sm rounded-lg border bg-muted overflow-hidden group">
            <SmartImage 
              src={value} 
              alt="Uploaded content" 
              className="size-full object-cover"
              fallbackType="section"
              fill
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => onChange("")}
                className="h-8 px-2"
              >
                <X className="size-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center bg-muted/30 text-muted-foreground">
            <ImageIcon className="size-8 mb-2 opacity-20" />
            <p className="text-sm">No image selected</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            accept="image/*"
            className="hidden"
          />
          
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="size-4 mr-2" />
                Upload Image
              </>
            )}
          </Button>

          <Dialog open={browsing} onOpenChange={setBrowsing}>
            <DialogTrigger asChild>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={fetchMedia}
              >
                <Library className="size-4 mr-2" />
                Browse Library
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Media Library</DialogTitle>
              </DialogHeader>
              
              <div className="relative my-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search by name or collection..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex-1 overflow-y-auto min-h-[300px] mt-4">
                {loadingMedia ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredMedia.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <ImageIcon className="size-12 mb-2 opacity-20" />
                    <p>No images found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pb-4">
                    {filteredMedia.map((file) => (
                      <div 
                        key={file.id}
                        className={`group relative aspect-square rounded-md border overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all ${
                          value === file.filePath ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => {
                          onChange(file.filePath);
                          setBrowsing(false);
                        }}
                      >
                        <SmartImage 
                          src={file.filePath} 
                          alt={file.name} 
                          className="size-full object-cover"
                          fallbackType="section"
                          fill
                        />
                        {value === file.filePath && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="bg-primary text-primary-foreground rounded-full p-1">
                              <Check className="size-4" />
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[10px] text-white truncate text-center">
                            {file.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex-1 min-w-[200px]">
            <Input 
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Or enter image URL manually..."
              className="h-9 text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
