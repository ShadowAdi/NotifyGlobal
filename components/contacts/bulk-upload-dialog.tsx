"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload, X, FileUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { bulkUploadContacts } from "@/actions/contacts.action";
import { useAuth } from "@/context/AuthContext";

interface BulkUploadContactsDialogProps {
  projectId: string;
  onContactsUploaded?: () => void;
}

/**
 * Parses CSV text into contact objects
 * Expected format: name,email,language,tags
 * Example: John Doe,john@example.com,en,premium|beta
 */
function parseCSV(csv: string) {
  const lines = csv.trim().split("\n");
  if (lines.length === 0) return [];

  const contacts = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(",").map((p) => p.trim());
    if (parts.length < 2) continue; // Need at least name and email

    const [name, email, language, tagsStr] = parts;
    
    contacts.push({
      projectId: "", // Will be set by caller
      name,
      email,
      language: language || "en",
      tags: tagsStr ? tagsStr.split("|").map(t => t.trim()).filter(Boolean) : undefined,
    });
  }

  return contacts;
}

export function BulkUploadContactsDialog({
  projectId,
  onContactsUploaded,
}: BulkUploadContactsDialogProps) {
  const [open, setOpen] = useState(false);
  const [csvData, setCsvData] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { token } = useAuth();

  const handleUpload = async () => {
    if (!token) {
      toast.error("You must be logged in to upload contacts");
      return;
    }

    if (!csvData.trim()) {
      toast.error("Please paste CSV data");
      return;
    }

    setIsUploading(true);

    const contacts = parseCSV(csvData);
    if (contacts.length === 0) {
      toast.error("No valid contacts found in CSV data");
      setIsUploading(false);
      return;
    }

    // Set projectId for all contacts
    const contactsWithProject = contacts.map(c => ({ ...c, projectId }));

    const result = await bulkUploadContacts(projectId, contactsWithProject, token);

    if (result.success) {
      const { created, failed, errors } = result.data;
      if (failed > 0) {
        toast.warning(
          `Uploaded ${created.length} contacts. ${failed} failed.`,
          {
            description: errors.slice(0, 3).join(", "),
          }
        );
      } else {
        toast.success(`Successfully uploaded ${created.length} contacts`);
      }
      setCsvData("");
      setOpen(false);
      onContactsUploaded?.();
    } else {
      toast.error(result.error);
    }

    setIsUploading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <Upload className="mr-2 size-4" />
            Bulk Upload
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Upload Contacts</DialogTitle>
          <DialogDescription>
            Paste CSV data with the format: <code>name,email,language,tags</code>
            <br />
            Tags should be separated by | (pipe). Example:
            <br />
            <code className="text-xs">John Doe,john@example.com,en,premium|beta</code>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="csv-data">CSV Data</Label>
            <Textarea
              id="csv-data"
              placeholder={"John Doe,john@example.com,en,premium|beta\nJane Smith,jane@example.com,es,vip"}
              rows={10}
              className="font-mono text-xs"
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              One contact per line. Language defaults to &ldquo;en&rdquo; if not specified.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setCsvData("");
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isUploading || !csvData.trim()}>
            {isUploading && <Loader2 className="mr-2 size-4 animate-spin" />}
            <FileUp className="mr-2 size-4" />
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
