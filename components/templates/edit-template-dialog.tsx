"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Pencil, Eye, EyeOff } from "lucide-react";

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
import { TemplatePreview } from "@/components/templates/template-preview";

import { updateTemplate } from "@/actions/template.action";
import { useAuth } from "@/context/AuthContext";
import {
  updateTemplateSchema,
  type UpdateTemplateFormValues,
} from "@/lib/validators/template";
import type { Template } from "@/types";

interface EditTemplateDialogProps {
  template: Template;
  onTemplateUpdated?: () => void;
  trigger?: React.ReactElement;
}

export function EditTemplateDialog({
  template,
  onTemplateUpdated,
  trigger,
}: EditTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { token } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateTemplateFormValues>({
    resolver: zodResolver(updateTemplateSchema),
    defaultValues: {
      name: template.name,
      subject: template.subject,
      body: template.body,
    },
  });

  const watchSubject = watch("subject");
  const watchBody = watch("body");

  useEffect(() => {
    if (open) {
      reset({
        name: template.name,
        subject: template.subject,
        body: template.body,
      });
      setShowPreview(false);
    }
  }, [open, template, reset]);

  const onSubmit = async (data: UpdateTemplateFormValues) => {
    if (!token) {
      toast.error("You must be logged in to edit a template");
      return;
    }

    const result = await updateTemplate(
      template.id,
      {
        name: data.name,
        subject: data.subject,
        body: data.body,
      },
      token
    );

    if (result.success) {
      toast.success("Template updated successfully");
      setOpen(false);
      onTemplateUpdated?.();
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
          )
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Template</DialogTitle>
          <DialogDescription>
            Update your email template. Use {"{{variable}}"} syntax for dynamic
            content.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-tpl-name">Template Name</Label>
            <Input
              id="edit-tpl-name"
              placeholder="e.g. Welcome Email"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-tpl-subject">Subject Line</Label>
            <Input
              id="edit-tpl-subject"
              placeholder="e.g. Welcome to {{company}}, {{name}}!"
              {...register("subject")}
              aria-invalid={!!errors.subject}
            />
            {errors.subject && (
              <p className="text-xs text-destructive">
                {errors.subject.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-tpl-body">Body</Label>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setShowPreview((v) => !v)}
              >
                {showPreview ? (
                  <EyeOff className="mr-1.5 size-3.5" />
                ) : (
                  <Eye className="mr-1.5 size-3.5" />
                )}
                {showPreview ? "Editor" : "Preview"}
              </Button>
            </div>

            {showPreview ? (
              <TemplatePreview
                subject={watchSubject}
                body={watchBody}
                className="min-h-[200px]"
              />
            ) : (
              <>
                <Textarea
                  id="edit-tpl-body"
                  placeholder={"Plain text or HTML content..."}
                  rows={10}
                  className="font-mono text-xs"
                  {...register("body")}
                  aria-invalid={!!errors.body}
                />
                <p className="text-[11px] text-muted-foreground">
                  Supports plain text or HTML. Use {"{{variable}}"} for dynamic
                  content.
                </p>
              </>
            )}
            {errors.body && (
              <p className="text-xs text-destructive">{errors.body.message}</p>
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
