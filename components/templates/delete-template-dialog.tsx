"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { deleteTemplate } from "@/actions/template.action";
import { useAuth } from "@/context/AuthContext";

interface DeleteTemplateDialogProps {
  templateId: string;
  templateName: string;
  onTemplateDeleted?: () => void;
  trigger?: React.ReactElement;
}

export function DeleteTemplateDialog({
  templateId,
  templateName,
  onTemplateDeleted,
  trigger,
}: DeleteTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { token } = useAuth();

  const handleDelete = async () => {
    if (!token) {
      toast.error("You must be logged in to delete a template");
      return;
    }

    setIsDeleting(true);

    const result = await deleteTemplate(templateId, token);

    if (result.success) {
      toast.success("Template deleted successfully");
      setOpen(false);
      onTemplateDeleted?.();
    } else {
      toast.error(result.error);
    }

    setIsDeleting(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          trigger ?? (
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 size-4" />
              Delete
            </Button>
          )
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Template</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{templateName}</strong>? This
            action cannot be undone. Any events using this template will need to
            be updated.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Delete Template
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
