"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getProjectById } from "@/actions/project.action";
import { getAllCampaigns } from "@/actions/campaign.action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Loader2,
  ArrowLeft,
  Plus,
  Send,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import type { Project, Campaign } from "@/types";

export default function CampaignsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = params.projectId as string;

  const fetchData = useCallback(async () => {
    if (!token || !projectId) return;
    setLoading(true);
    setError(null);

    const [projectResult, campaignsResult] = await Promise.all([
      getProjectById(projectId, token),
      getAllCampaigns(projectId, token, { limit: 500 }),
    ]);

    if (projectResult.success) {
      setProject(projectResult.data);
    } else {
      setError(projectResult.error);
    }

    if (campaignsResult.success) {
      setCampaigns(campaignsResult.data.data);
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

  const getStatusBadge = (status: Campaign["status"]) => {
    const styles = {
      draft: "bg-gray-100 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-300",
      sending: "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-400",
      completed: "bg-green-100 text-green-700 ring-green-200 dark:bg-green-900/20 dark:text-green-400",
      failed: "bg-red-100 text-red-700 ring-red-200 dark:bg-red-900/20 dark:text-red-400",
    };

    const icons = {
      draft: Clock,
      sending: Send,
      completed: CheckCircle2,
      failed: XCircle,
    };

    const Icon = icons[status];

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ${styles[status]}`}
      >
        <Icon className="size-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

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
              <Send className="mb-4 size-12 text-muted-foreground" />
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
            <p className="mt-1 text-muted-foreground">
              Manage campaigns for{" "}
              <span className="font-medium text-foreground">
                {project.name}
              </span>
            </p>
          </div>
          <Button onClick={() => router.push(`/projects/${projectId}/campaigns/new`)}>
            <Plus className="mr-2 size-4" />
            New Campaign
          </Button>
        </div>

        {/* Campaigns table */}
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Send className="mb-4 size-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">
                No campaigns yet
              </h3>
              <p className="mt-1 mb-4 text-sm text-muted-foreground">
                Create your first campaign to start sending messages.
              </p>
              <Button onClick={() => router.push(`/projects/${projectId}/campaigns/new`)}>
                <Plus className="mr-2 size-4" />
                New Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Campaign Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Channel
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Progress
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Scheduled
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Created
                    </th>
                    <th className="w-20 px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {campaigns.map((campaign) => (
                    <tr
                      key={campaign.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() =>
                        router.push(`/projects/${projectId}/campaigns/${campaign.id}`)
                      }
                    >
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {campaign.name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:ring-purple-800 capitalize">
                          {campaign.channel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(campaign.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {campaign.totalContacts ? (
                          <div className="flex items-center gap-2">
                            <Users className="size-3.5" />
                            <span>
                              {campaign.sentCount}/{campaign.totalContacts}
                            </span>
                            {Number(campaign.failedCount) > 0 && (
                              <span className="text-red-600">
                                ({campaign.failedCount} failed)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {campaign.scheduledAt ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {new Date(campaign.scheduledAt).toLocaleString()}
                          </div>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/projects/${projectId}/campaigns/${campaign.id}`);
                          }}
                        >
                          <ArrowRight className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
