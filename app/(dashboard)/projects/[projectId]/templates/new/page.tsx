"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getProjectById } from "@/actions/project.action";
import { createTemplate } from "@/actions/template.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { TemplatePreview } from "@/components/templates/template-preview";
import {
  createTemplateSchema,
  type CreateTemplateFormValues,
} from "@/lib/validators/template";
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import type { Project } from "@/types";

export default function NewTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const projectId = params.projectId as string;

  const fetchProject = useCallback(async () => {
    if (!token || !projectId) return;
    setLoading(true);
    const result = await getProjectById(projectId, token);
    if (result.success) {
      setProject(result.data);
    }
    setLoading(false);
  }, [token, projectId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/sign-in");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (token && projectId) {
      fetchProject();
    }
  }, [token, projectId, fetchProject]);

  const {
    register,
    handleSubmit,
    watch,
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
      router.push(`/projects/${projectId}/templates/${result.data.id}`);
    } else {
      toast.error(result.error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !project) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">
                N
              </span>
            </div>
            <span className="text-xl font-semibold text-foreground">
              NotifyGlobal
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.push(`/projects/${projectId}/templates`)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Templates
        </Button>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Create Template
          </h1>
          <p className="mt-1 text-muted-foreground">
            Create an email template for{" "}
            <span className="font-medium text-foreground">
              {project.name}
            </span>
            . Use {"{{variable}}"} syntax for dynamic content. Body can be plain
            text or HTML.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left — Editor */}
            <div className="grid gap-5">
              <Card>
                <CardContent className="grid gap-5 pt-6">
                  <div className="grid gap-2">
                    <Label htmlFor="tpl-name">Template Name</Label>
                    <Input
                      id="tpl-name"
                      placeholder="e.g. Welcome Email"
                      {...register("name")}
                      aria-invalid={!!errors.name}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive">
                        {errors.name.message}
                      </p>
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
                    <Label htmlFor="tpl-body">Body</Label>
                    <Textarea
                      id="tpl-body"
                      placeholder={
                        "Plain text or HTML content...\n\nHi {{name}},\n\nWelcome to {{company}}!"
                      }
                      rows={16}
                      className="font-mono text-xs"
                      {...register("body")}
                      aria-invalid={!!errors.body}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Supports plain text or HTML. Use {"{{variable}}"} for
                      dynamic content.
                    </p>
                    {errors.body && (
                      <p className="text-xs text-destructive">
                        {errors.body.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Create Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    router.push(`/projects/${projectId}/templates`)
                  }
                >
                  Cancel
                </Button>
              </div>
            </div>

            {/* Right — Live Preview */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium text-foreground">
                  Live Preview
                </h2>
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
                  {showPreview ? "Hide" : "Show"}
                </Button>
              </div>

              {showPreview ? (
                <TemplatePreview
                  subject={watchSubject}
                  body={watchBody}
                  className="sticky top-6"
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Eye className="mb-3 size-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click &ldquo;Show&rdquo; to preview your template
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
