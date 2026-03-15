"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { updateProject } from "@/actions/project.action";
import { useAuth } from "@/context/AuthContext";
import {
  updateProjectSchema,
  type UpdateProjectFormValues,
} from "@/lib/validators/project";
import type { Project } from "@/types";

interface EditProjectDialogProps {
  project: Project;
  onProjectUpdated?: () => void;
  trigger?: React.ReactElement;
}

export function EditProjectDialog({
  project,
  onProjectUpdated,
  trigger,
}: EditProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const { token } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProjectFormValues>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      name: project.name,
      description: project.description ?? "",
    },
  });

  // Reset form when project changes or dialog opens
  useEffect(() => {
    if (open) {
      reset({
        name: project.name,
        description: project.description ?? "",
      });
    }
  }, [open, project, reset]);

  const onSubmit = async (data: UpdateProjectFormValues) => {
    if (!token) {
      toast.error("You must be logged in to edit a project");
      return;
    }

    const result = await updateProject(
      project.id,
      {
        name: data.name,
        description: data.description || undefined,
      },
      token
    );

    if (result.success) {
      toast.success("Project updated successfully");
      setOpen(false);
      onProjectUpdated?.();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 size-4" />
              Edit
            </Button>
          ) as React.ReactElement
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update your project name and description.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Project Name</Label>
            <Input
              id="edit-name"
              placeholder="My Awesome Project"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-description">
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="edit-description"
              placeholder="A brief description of your project..."
              rows={3}
              {...register("description")}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
