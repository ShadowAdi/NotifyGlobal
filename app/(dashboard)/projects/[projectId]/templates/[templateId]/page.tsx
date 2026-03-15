"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getTemplateById } from "@/actions/template.action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EditTemplateDialog } from "@/components/templates/edit-template-dialog";
import { DeleteTemplateDialog } from "@/components/templates/delete-template-dialog";
import { TemplatePreview } from "@/components/templates/template-preview";
import {
  Loader2,
  ArrowLeft,
  Mail,
  Calendar,
  Tag,
  Code,
  FileText,
} from "lucide-react";
import type { Template } from "@/types";

function isHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

export default function TemplatePage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = params.projectId as string;
  const templateId = params.templateId as string;

  const fetchTemplate = useCallback(async () => {
    if (!token || !templateId) return;
    setLoading(true);
    setError(null);

    const result = await getTemplateById(templateId, token);

    if (result.success) {
      setTemplate(result.data);
    } else {
      setError(result.error);
    }

    setLoading(false);
  }, [token, templateId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/sign-in");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (token && templateId) {
      fetchTemplate();
    }
  }, [token, templateId, fetchTemplate]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (error || !template) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <Button
            variant="ghost"
            onClick={() => router.push(`/projects/${projectId}/templates`)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to Templates
          </Button>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Mail className="mb-4 size-12 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">
                Template not found
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {error || "The template you're looking for doesn't exist."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const bodyIsHtml = isHtml(template.body);

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

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.push(`/projects/${projectId}/templates`)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Templates
        </Button>

        {/* Template header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">
                {template.name}
              </h1>
              <span
                className={
                  bodyIsHtml
                    ? "inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    : "inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400"
                }
              >
                {bodyIsHtml ? (
                  <Code className="size-3" />
                ) : (
                  <FileText className="size-3" />
                )}
                {bodyIsHtml ? "HTML" : "Plain Text"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                Created {new Date(template.createdAt).toLocaleDateString()}
              </span>
              {template.updatedAt &&
                template.updatedAt !== template.createdAt && (
                  <span className="flex items-center gap-1.5">
                    Updated{" "}
                    {new Date(template.updatedAt).toLocaleDateString()}
                  </span>
                )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <EditTemplateDialog
              template={template}
              onTemplateUpdated={fetchTemplate}
            />
            <DeleteTemplateDialog
              templateId={template.id}
              templateName={template.name}
              onTemplateDeleted={() =>
                router.push(`/projects/${projectId}/templates`)
              }
            />
          </div>
        </div>

        {/* Variables */}
        {template.variables && template.variables.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Tag className="size-4" />
                Variables ({template.variables.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {template.variables.map((variable) => (
                  <span
                    key={variable}
                    className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 font-mono text-xs font-medium text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-800"
                  >
                    {`{{${variable}}}`}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview */}
        <div className="mb-2">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Preview
          </h2>
          <TemplatePreview subject={template.subject} body={template.body} />
        </div>
      </main>
    </div>
  );
}
