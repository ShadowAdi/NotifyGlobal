"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Eye, EyeOff } from "lucide-react";

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

import { createTemplate } from "@/actions/template.action";
import { useAuth } from "@/context/AuthContext";
import {
  createTemplateSchema,
  type CreateTemplateFormValues,
} from "@/lib/validators/template";

interface CreateTemplateDialogProps {
  projectId: string;
  onTemplateCreated?: () => void;
}

export function CreateTemplateDialog({
  projectId,
  onTemplateCreated,
}: CreateTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { token } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTemplateFormValues>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      name: "",
      subject: "",
      body: "",
    },
  });

  const watchSubject = watch("subject");
  const watchBody = watch("body");

  const onSubmit = async (data: CreateTemplateFormValues) => {
    if (!token) {
      toast.error("You must be logged in to create a template");
      return;
    }

    const result = await createTemplate(
      {
        projectId,
        name: data.name,
        subject: data.subject,
        body: data.body,
      },
      token
    );

    if (result.success) {
      toast.success("Template created successfully");
      reset();
      setShowPreview(false);
      setOpen(false);
      onTemplateCreated?.();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) {
          setShowPreview(false);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-2 size-4" />
            New Template
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Template</DialogTitle>
          <DialogDescription>
            Create an email template. Use {"{{variable}}"} syntax for dynamic
            content. Body can be plain text or HTML.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="tpl-name">Template Name</Label>
            <Input
              id="tpl-name"
              placeholder="e.g. Welcome Email"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tpl-subject">Subject Line</Label>
            <Input
              id="tpl-subject"
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
              <Label htmlFor="tpl-body">Body</Label>
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
                  id="tpl-body"
                  placeholder={"Plain text or HTML content...\n\nHi {{name}},\n\nWelcome to {{company}}!"}
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
              Create Template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
