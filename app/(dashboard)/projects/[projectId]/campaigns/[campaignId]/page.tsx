"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getCampaign } from "@/actions/campaign.action";
import { SendCampaign } from "@/actions/campaign-sender.action";
import { createCampaign } from "@/actions/campaign.action";
import { getTemplateById } from "@/actions/template.action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { DeleteCampaignDialog } from "@/components/campaigns/delete-campaign-dialog";
import {
  Loader2,
  ArrowLeft,
  Send,
  Pencil,
  Calendar,
  Users,
  Mail,
  MessageSquare,
  Tag,
  Languages,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import type { Campaign } from "@/types";

export default function CampaignPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reuseAfterSend, setReuseAfterSend] = useState(true);
  const [templateVariables, setTemplateVariables] = useState<string[] | null>(null);

  const projectId = params.projectId as string;
  const campaignId = params.campaignId as string;

  const fetchCampaign = useCallback(async () => {
    if (!token || !campaignId || !projectId) return;
    setLoading(true);
    setError(null);

    const result = await getCampaign(campaignId, projectId, token);

    if (result.success) {
      setCampaign(result.data);
      if (result.data.templateId) {
        const tpl = await getTemplateById(result.data.templateId, token);
        if (tpl.success) setTemplateVariables(tpl.data.variables ?? []);
      } else {
        setTemplateVariables(null);
      }
    } else {
      setError(result.error);
    }

    setLoading(false);
  }, [token, campaignId, projectId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/sign-in");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (token && campaignId && projectId) {
      fetchCampaign();
    }
  }, [token, campaignId, projectId, fetchCampaign]);

  const activeVariables = (() => {
    const builtinVars = new Set([
      "name",
      "email",
      "language",
      "discord_username",
      "discordUsername",
    ]);
    const vars = campaign?.templateId ? templateVariables ?? [] : [];
    return vars.filter((v) => v && !builtinVars.has(v));
  })();

  const missingVariables = (() => {
    if (!campaign) return [];
    const values = (campaign.variables ?? {}) as Record<string, string>;
    return activeVariables.filter((v) => !String(values?.[v] ?? "").trim());
  })();

  const handleSendCampaign = async () => {
    if (!token || !campaign) return;
    if (missingVariables.length > 0) {
      toast.error("Please fill required template variables before sending.");
      router.push(`/projects/${projectId}/campaigns/${campaignId}/edit`);
      return;
    }

    setSending(true);
    const result = await SendCampaign(campaignId, token);

    if (result.success) {
      toast.success("Campaign sent successfully!");
      fetchCampaign(); // Refresh campaign data

      if (reuseAfterSend) {
        const created = await createCampaign(
          projectId,
          {
            name: `${campaign.name} (copy)`,
            channel: campaign.channel,
            templateId: campaign.templateId ?? undefined,
            subject: campaign.subject ?? undefined,
            message: campaign.message ?? undefined,
            variables: (campaign.variables ?? {}) as Record<string, string>,
            filterType: campaign.filterType,
            filterLanguage: campaign.filterLanguage ?? undefined,
            filterTags: campaign.filterTags ?? undefined,
            contactIds: campaign.contactIds ?? undefined,
          },
          token
        );
        if (created.success) {
          toast.success("Draft copy created for reuse.");
          router.push(`/projects/${projectId}/campaigns/${created.data.id}/edit`);
        }
      }
    } else {
      toast.error(result.error || "Failed to send campaign");
    }

    setSending(false);
    setConfirmOpen(false);
  };

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
        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium ring-1 ${styles[status]}`}
      >
        <Icon className="size-4" />
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

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <Button
            variant="ghost"
            onClick={() => router.push(`/projects/${projectId}/campaigns`)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to Campaigns
          </Button>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Send className="mb-4 size-12 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">
                Campaign not found
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {error || "The campaign you're looking for doesn't exist."}
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

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.push(`/projects/${projectId}/campaigns`)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Campaigns
        </Button>

        {/* Campaign header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-foreground">
              {campaign.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {getStatusBadge(campaign.status)}
              <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:ring-purple-800 capitalize">
                {campaign.channel}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                Created {new Date(campaign.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {campaign.status === "draft" && (
              <>
                <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                  <AlertDialogTrigger
                    render={
                      <Button variant="default" size="sm" disabled={sending}>
                        {sending ? (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 size-4" />
                        )}
                        Send Campaign
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Send this campaign?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will send <strong>{campaign.name}</strong> to the selected contacts.
                        {activeVariables.length > 0 && (
                          <span className="block mt-2">
                            Template variables required:{" "}
                            <span className="font-mono">
                              {activeVariables.map((v) => `{{${v}}}`).join(", ")}
                            </span>
                          </span>
                        )}
                        {missingVariables.length > 0 && (
                          <span className="block mt-2 text-destructive">
                            Missing values for:{" "}
                            <span className="font-mono">
                              {missingVariables.map((v) => `{{${v}}}`).join(", ")}
                            </span>
                            . Go to Edit to fill them.
                          </span>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <label className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1 size-4"
                        checked={reuseAfterSend}
                        onChange={(e) => setReuseAfterSend(e.target.checked)}
                      />
                      <span>
                        Create a draft copy after sending (so you can reuse without rebuilding).
                      </span>
                    </label>

                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          if (missingVariables.length > 0) {
                            router.push(`/projects/${projectId}/campaigns/${campaignId}/edit`);
                            setConfirmOpen(false);
                            return;
                          }
                          handleSendCampaign();
                        }}
                        disabled={sending}
                      >
                        Send
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(
                      `/projects/${projectId}/campaigns/${campaignId}/edit`
                    )
                  }
                >
                  <Pencil className="mr-2 size-4" />
                  Edit
                </Button>
              </>
            )}
            <DeleteCampaignDialog
              campaignId={campaign.id}
              campaignName={campaign.name}
              projectId={projectId}
              onCampaignDeleted={() =>
                router.push(`/projects/${projectId}/campaigns`)
              }
            />
          </div>
        </div>

        {/* Campaign details */}
        <div className="grid gap-6">
          {/* Campaign Stats */}
          {campaign.totalContacts && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Campaign Progress</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <Users className="size-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{campaign.totalContacts}</p>
                    <p className="text-xs text-muted-foreground">Total Contacts</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="size-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{campaign.sentCount}</p>
                    <p className="text-xs text-muted-foreground">Sent</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <XCircle className="size-8 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold">{campaign.failedCount}</p>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content</CardTitle>
              <CardDescription>
                {campaign.templateId
                  ? "This campaign uses a template"
                  : "Custom content for this campaign"}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {campaign.templateId && (
                <div className="flex items-center gap-3">
                  <FileText className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Template ID</p>
                    <p className="text-sm font-medium">{campaign.templateId}</p>
                  </div>
                </div>
              )}

              {campaign.subject && (
                <div className="flex items-start gap-3">
                  <Mail className="size-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Subject</p>
                    <p className="text-sm font-medium">{campaign.subject}</p>
                  </div>
                </div>
              )}

              {campaign.message && (
                <div className="flex items-start gap-3">
                  <MessageSquare className="size-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Message</p>
                    <div className="text-sm whitespace-pre-wrap rounded-lg bg-muted p-3">
                      {campaign.message}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filter Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Target Audience</CardTitle>
              <CardDescription>
                Contact selection criteria for this campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-3">
                <Users className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Filter Type</p>
                  <p className="text-sm font-medium capitalize">
                    {campaign.filterType}
                  </p>
                </div>
              </div>

              {campaign.filterLanguage && (
                <div className="flex items-center gap-3">
                  <Languages className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Language Filter</p>
                    <p className="text-sm font-medium uppercase">
                      {campaign.filterLanguage}
                    </p>
                  </div>
                </div>
              )}

              {campaign.filterTags && campaign.filterTags.length > 0 && (
                <div className="flex items-start gap-3">
                  <Tag className="size-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-2">Tag Filters</p>
                    <div className="flex flex-wrap gap-2">
                      {campaign.filterTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {campaign.contactIds && campaign.contactIds.length > 0 && (
                <div className="flex items-center gap-3">
                  <Users className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Manual Selection</p>
                    <p className="text-sm font-medium">
                      {campaign.contactIds.length} contact(s) selected
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scheduling */}
          {campaign.scheduledAt && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Calendar className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Scheduled For</p>
                    <p className="text-sm font-medium">
                      {new Date(campaign.scheduledAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
