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

import { deleteProject } from "@/actions/project.action";
import { useAuth } from "@/context/AuthContext";

interface DeleteProjectDialogProps {
  projectId: string;
  projectName: string;
  onProjectDeleted?: () => void;
  trigger?: React.ReactElement;
}

export function DeleteProjectDialog({
  projectId,
  projectName,
  onProjectDeleted,
  trigger,
}: DeleteProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { token } = useAuth();

  const handleDelete = async () => {
    if (!token) {
      toast.error("You must be logged in to delete a project");
      return;
    }

    setIsDeleting(true);

    const result = await deleteProject(projectId, token);

    if (result.success) {
      toast.success("Project deleted successfully");
      setOpen(false);
      onProjectDeleted?.();
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
          <AlertDialogTitle>Delete Project</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{projectName}</strong>? This
            will permanently remove the project and all its contacts, templates,
            events, and campaigns. This action cannot be undone.
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
            Delete Project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
