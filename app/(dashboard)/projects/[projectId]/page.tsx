"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getProjectById } from "@/actions/project.action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import {
  Loader2,
  ArrowLeft,
  FolderOpen,
  Mail,
  Users,
  Zap,
  Key,
  Send,
  Calendar,
} from "lucide-react";
import type { Project } from "@/types";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = params.projectId as string;

  const fetchProject = useCallback(async () => {
    if (!token || !projectId) return;
    setLoading(true);
    setError(null);

    const result = await getProjectById(projectId, token);

    if (result.success) {
      setProject(result.data);
    } else {
      setError(result.error);
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
              <FolderOpen className="mb-4 size-12 text-muted-foreground" />
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

  const sections = [
    {
      label: "Templates",
      description: "Email templates with variables and translations",
      icon: Mail,
      count: "—",
    },
    {
      label: "Contacts",
      description: "Recipients with language preferences",
      icon: Users,
      count: "—",
    },
    {
      label: "Events",
      description: "Trigger definitions for automated notifications",
      icon: Zap,
      count: "—",
    },
    {
      label: "API Keys",
      description: "Authentication keys for API access",
      icon: Key,
      count: "—",
    },
    {
      label: "Campaigns",
      description: "Bulk notification sends to contacts",
      icon: Send,
      count: "—",
    },
  ];

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
          onClick={() => router.push("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Dashboard
        </Button>

        {/* Project header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-foreground">
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-2 text-muted-foreground">
                {project.description}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="size-3.5" />
              <span>
                Created {new Date(project.createdAt).toLocaleDateString()}
              </span>
              {project.updatedAt && project.updatedAt !== project.createdAt && (
                <>
                  <span>·</span>
                  <span>
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <EditProjectDialog
              project={project}
              onProjectUpdated={fetchProject}
            />
            <DeleteProjectDialog
              projectId={project.id}
              projectName={project.name}
              onProjectDeleted={() => router.push("/dashboard")}
            />
          </div>
        </div>

        {/* Project sections */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <Card key={section.label} className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <section.icon className="size-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle>{section.label}</CardTitle>
                  <CardDescription className="text-xs">
                    {section.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {section.count}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Coming soon
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
