"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

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

import { createProject } from "@/actions/project.action";
import { useAuth } from "@/context/AuthContext";
import {
  createProjectSchema,
  type CreateProjectFormValues,
} from "@/lib/validators/project";

interface CreateProjectDialogProps {
  onProjectCreated?: () => void;
}

export function CreateProjectDialog({
  onProjectCreated,
}: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const { token } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: CreateProjectFormValues) => {
    if (!token) {
      toast.error("You must be logged in to create a project");
      return;
    }

    const result = await createProject(
      {
        name: data.name,
        description: data.description || undefined,
      },
      token
    );

    if (result.success) {
      toast.success("Project created successfully");
      reset();
      setOpen(false);
      onProjectCreated?.();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-2 size-4" />
            New Project
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Create a new project to organize your contacts, templates, and
            campaigns.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              placeholder="My Awesome Project"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
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
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
