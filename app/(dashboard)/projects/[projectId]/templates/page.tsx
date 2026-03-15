"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getProjectById } from "@/actions/project.action";
import { getTemplatesByProject } from "@/actions/template.action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateTemplateDialog } from "@/components/templates/create-template-dialog";
import {
  Loader2,
  ArrowLeft,
  Mail,
  ArrowRight,
  Code,
  FileText,
} from "lucide-react";
import type { Project, Template } from "@/types";

function isHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

export default function TemplatesPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = params.projectId as string;

  const fetchData = useCallback(async () => {
    if (!token || !projectId) return;
    setLoading(true);
    setError(null);

    const [projectResult, templatesResult] = await Promise.all([
      getProjectById(projectId, token),
      getTemplatesByProject(projectId, token, { limit: 50 }),
    ]);

    if (projectResult.success) {
      setProject(projectResult.data);
    } else {
      setError(projectResult.error);
    }

    if (templatesResult.success) {
      setTemplates(templatesResult.data.data);
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
      fetchData();
    }
  }, [token, projectId, fetchData]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to Dashboard
          </Button>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Mail className="mb-4 size-12 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">
                Project not found
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {error || "The project you're looking for doesn't exist."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          onClick={() => router.push(`/projects/${projectId}`)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to {project.name}
        </Button>

        {/* Page header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Templates</h1>
            <p className="mt-1 text-muted-foreground">
              Email templates for{" "}
              <span className="font-medium text-foreground">
                {project.name}
              </span>
            </p>
          </div>
          <CreateTemplateDialog
            projectId={projectId}
            onTemplateCreated={fetchData}
          />
        </div>

        {/* Templates list */}
        {templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Mail className="mb-4 size-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">
                No templates yet
              </h3>
              <p className="mt-1 mb-4 text-sm text-muted-foreground">
                Create your first email template to get started.
              </p>
              <CreateTemplateDialog
                projectId={projectId}
                onTemplateCreated={fetchData}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() =>
                  router.push(
                    `/projects/${projectId}/templates/${template.id}`
                  )
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-1">
                      {template.name}
                    </CardTitle>
                    <span
                      className={
                        isHtml(template.body)
                          ? "inline-flex shrink-0 items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          : "inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      }
                    >
                      {isHtml(template.body) ? (
                        <Code className="size-3" />
                      ) : (
                        <FileText className="size-3" />
                      )}
                      {isHtml(template.body) ? "HTML" : "Text"}
                    </span>
                  </div>
                  <CardDescription className="line-clamp-1">
                    {template.subject}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {template.variables && template.variables.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {template.variables.length} variable
                        {template.variables.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(template.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
