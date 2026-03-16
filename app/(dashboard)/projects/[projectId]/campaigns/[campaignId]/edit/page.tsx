"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getCampaign, updateCampaign } from "@/actions/campaign.action";
import { getTemplateById } from "@/actions/template.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  updateCampaignSchema,
  type UpdateCampaignFormValues,
} from "@/lib/validators/campaign";
import { Loader2, ArrowLeft, Info, Send } from "lucide-react";
import type { Campaign } from "@/types";
import { extractTemplateVariables } from "@/lib/template-helpers";

export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [templateVariables, setTemplateVariables] = useState<string[] | null>(null);
  const [campaignVariables, setCampaignVariables] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = params.projectId as string;
  const campaignId = params.campaignId as string;

  const fetchCampaign = useCallback(async () => {
    if (!token || !campaignId || !projectId) return;
    setLoading(true);
    setError(null);

    const result = await getCampaign(campaignId, projectId, token);

    if (result.success) {
      setCampaign(result.data);
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateCampaignFormValues>({
    resolver: zodResolver(updateCampaignSchema),
  });

  useEffect(() => {
    if (campaign) {
      reset({
        name: campaign.name,
        channel: campaign.channel,
        subject: campaign.subject || "",
        message: campaign.message || "",
        variables: (campaign.variables ?? null) as Record<string, string> | null,
        status: campaign.status,
        scheduledAt: campaign.scheduledAt
          ? new Date(campaign.scheduledAt).toISOString().slice(0, 16)
          : "",
      });

      setCampaignVariables(((campaign.variables ?? {}) as Record<string, string>) ?? {});
    }
  }, [campaign, reset]);

  useEffect(() => {
    const loadTemplateVars = async () => {
      if (!token || !campaign?.templateId) {
        setTemplateVariables(null);
        return;
      }
      const tpl = await getTemplateById(campaign.templateId, token);
      if (tpl.success) {
        setTemplateVariables(tpl.data.variables ?? []);
      } else {
        setTemplateVariables(null);
      }
    };
    loadTemplateVars();
  }, [campaign?.templateId, token]);

  const builtinVars = new Set([
    "name",
    "email",
    "language",
    "discord_username",
    "discordUsername",
  ]);

  const activeVariables = (() => {
    if (!campaign) return [];
    const vars = campaign.templateId
      ? templateVariables ?? []
      : extractTemplateVariables(campaign.subject ?? "", campaign.message ?? "");
    return (vars ?? []).filter((v) => v && !builtinVars.has(v));
  })();

  useEffect(() => {
    setCampaignVariables((prev) => {
      const next: Record<string, string> = {};
      for (const key of activeVariables) {
        next[key] = prev[key] ?? "";
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?.templateId, templateVariables, campaign?.subject, campaign?.message]);

  const onSubmit = async (data: UpdateCampaignFormValues) => {
    if (!token) {
      toast.error("You must be logged in to edit a campaign");
      return;
    }

    const result = await updateCampaign(
      campaignId,
      projectId,
      {
        name: data.name,
        channel: data.channel,
        subject: data.subject || undefined,
        message: data.message || undefined,
        variables: campaignVariables,
        status: data.status,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      },
      token
    );

    if (result.success) {
      toast.success("Campaign updated successfully");
      router.push(`/projects/${projectId}/campaigns/${campaignId}`);
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

  if (campaign.status === "sending" || campaign.status === "completed") {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <Button
            variant="ghost"
            onClick={() => router.push(`/projects/${projectId}/campaigns/${campaignId}`)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to Campaign
          </Button>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Send className="mb-4 size-12 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">
                Cannot edit campaign
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This campaign is {campaign.status} and cannot be edited.
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
              <span className="text-lg font-bold text-primary-foreground">N</span>
            </div>
            <span className="text-xl font-semibold text-foreground">NotifyGlobal</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <Button
          variant="ghost"
          onClick={() => router.push(`/projects/${projectId}/campaigns/${campaignId}`)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Campaign
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Edit Campaign</h1>
          <p className="mt-1 text-muted-foreground">
            Update{" "}
            <span className="font-medium text-foreground">{campaign.name}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>
                Update campaign information (cannot change filters/contacts)
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Campaign Name</Label>
                <Input
                  id="edit-name"
                  placeholder="Black Friday Sale"
                  {...register("name")}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-channel">Channel</Label>
                <select
                  id="edit-channel"
                  {...register("channel")}
                  className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="discord">Discord</option>
                  <option value="slack">Slack</option>
                </select>
              </div>

              {!campaign.templateId && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-subject">Subject</Label>
                    <Input
                      id="edit-subject"
                      placeholder="Welcome to our platform!"
                      {...register("subject")}
                    />
                    {errors.subject && (
                      <p className="text-xs text-destructive">{errors.subject.message}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-message">Message</Label>
                    <textarea
                      id="edit-message"
                      rows={6}
                      placeholder="Hello {{name}}, welcome to our platform..."
                      {...register("message")}
                      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    {errors.message && (
                      <p className="text-xs text-destructive">{errors.message.message}</p>
                    )}
                  </div>
                </>
              )}

              {activeVariables.length > 0 && (
                <div className="grid gap-3">
                  <div className="grid gap-1">
                    <p className="text-sm font-medium">Template Variables</p>
                    <p className="text-xs text-muted-foreground">
                      Built-in variables like {"{{name}}"} and {"{{email}}"} are filled automatically. Provide values for the variables below.
                    </p>
                  </div>
                  <div className="grid gap-4">
                    {activeVariables.map((variable) => (
                      <div key={variable} className="grid gap-2">
                        <Label htmlFor={`edit-var-${variable}`}>
                          {"{{"}{variable}{"}}"}
                        </Label>
                        <Input
                          id={`edit-var-${variable}`}
                          placeholder={`Value for ${variable}`}
                          value={campaignVariables[variable] ?? ""}
                          onChange={(e) =>
                            setCampaignVariables((prev) => ({
                              ...prev,
                              [variable]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  {...register("status")}
                  className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="draft">Draft</option>
                  <option value="sending">Sending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-scheduledAt">Schedule (Optional)</Label>
                <Input
                  id="edit-scheduledAt"
                  type="datetime-local"
                  {...register("scheduledAt")}
                />
              </div>
            </CardContent>
          </Card>

          <div className="rounded-lg bg-muted p-3 flex items-start gap-2">
            <Info className="size-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> You cannot change the target audience or filters after campaign creation. To modify those, create a new campaign.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/projects/${projectId}/campaigns/${campaignId}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
