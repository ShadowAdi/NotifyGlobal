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

import { deleteContact } from "@/actions/contacts.action";
import { useAuth } from "@/context/AuthContext";

interface DeleteContactDialogProps {
  contactId: string;
  contactName: string;
  onContactDeleted?: () => void;
  trigger?: React.ReactElement;
}

export function DeleteContactDialog({
  contactId,
  contactName,
  onContactDeleted,
  trigger,
}: DeleteContactDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { token } = useAuth();

  const handleDelete = async () => {
    if (!token) {
      toast.error("You must be logged in to delete a contact");
      return;
    }

    setIsDeleting(true);

    const result = await deleteContact(contactId, token);

    if (result.success) {
      toast.success("Contact deleted successfully");
      setOpen(false);
      onContactDeleted?.();
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
          <AlertDialogTitle>Delete Contact</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{contactName}</strong>? This
            action cannot be undone.
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
            Delete Contact
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
