"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getProjectById } from "@/actions/project.action";
import { createCampaign } from "@/actions/campaign.action";
import { getContactsByProject } from "@/actions/contacts.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createCampaignSchema,
  type CreateCampaignFormValues,
} from "@/lib/validators/campaign";
import { Loader2, ArrowLeft, Info, CheckSquare, Square } from "lucide-react";
import type { Project, Contact, Template } from "@/types";
import { getTemplatesByProject } from "@/actions";
import { extractTemplateVariables } from "@/lib/template-helpers";

export default function NewCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [campaignVariables, setCampaignVariables] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const projectId = params.projectId as string;

  const fetchData = useCallback(async () => {
    if (!token || !projectId) return;
    setLoading(true);

    const [projectResult, contactsResult, templatesResult] = await Promise.all([
      getProjectById(projectId, token),
      getContactsByProject(projectId, token, { limit: 500 }),
      getTemplatesByProject(projectId, token, { limit: 100 }),
    ]);

    if (projectResult.success) {
      setProject(projectResult.data);
    }
    if (contactsResult.success) {
      setContacts(contactsResult.data.data);
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

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateCampaignFormValues>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      name: "",
      channel: "email",
      filterType: "manual",
      subject: "",
      message: "",
    },
  });

  const filterType = watch("filterType");
  const useTemplate = watch("templateId");
  const watchSubject = watch("subject");
  const watchMessage = watch("message");

  const builtinVars = new Set([
    "name",
    "email",
    "language",
    "discord_username",
    "discordUsername",
  ]);

  const selectedTemplate = useTemplate
    ? templates.find((t) => t.id === useTemplate) ?? null
    : null;

  const activeVariables = (() => {
    const vars = selectedTemplate
      ? selectedTemplate.variables ?? []
      : extractTemplateVariables(watchSubject ?? "", watchMessage ?? "");
    return vars.filter((v) => v && !builtinVars.has(v));
  })();

  useEffect(() => {
    // Keep only variables that are currently used (prevents stale keys).
    setCampaignVariables((prev) => {
      const next: Record<string, string> = {};
      for (const key of activeVariables) {
        next[key] = prev[key] ?? "";
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useTemplate, watchSubject, watchMessage, templates.length]);

  const toggleSelectAll = () => {
    if (selectedContactIds.size === contacts.length) {
      setSelectedContactIds(new Set());
    } else {
      setSelectedContactIds(new Set(contacts.map((c) => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedContactIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedContactIds(newSelected);
  };

  const onSubmit = async (data: CreateCampaignFormValues) => {
    if (!token) {
      toast.error("You must be logged in to create a campaign");
      return;
    }

    // Validate based on filter type
    if (data.filterType === "manual" && selectedContactIds.size === 0) {
      toast.error("Please select at least one contact");
      return;
    }

    // Parse filter tags
    let filterTagsArray: string[] | undefined;
    if (data.filterType === "tags" && data.filterTags) {
      filterTagsArray = data.filterTags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
    }

    const result = await createCampaign(
      projectId,
      {
        name: data.name,
        channel: data.channel,
        templateId: data.templateId || undefined,
        subject: data.subject || undefined,
        message: data.message || undefined,
        variables: campaignVariables,
        filterType: data.filterType,
        filterLanguage: data.filterLanguage || undefined,
        filterTags: filterTagsArray,
        contactIds: data.filterType === "manual" ? Array.from(selectedContactIds) : undefined,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      },
      token
    );

    if (result.success) {
      toast.success("Campaign created successfully");
      router.push(`/projects/${projectId}/campaigns/${result.data.id}`);
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
              <span className="text-lg font-bold text-primary-foreground">N</span>
            </div>
            <span className="text-xl font-semibold text-foreground">NotifyGlobal</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <Button
          variant="ghost"
          onClick={() => router.push(`/projects/${projectId}/campaigns`)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Campaigns
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">New Campaign</h1>
          <p className="mt-1 text-muted-foreground">
            Create a campaign for{" "}
            <span className="font-medium text-foreground">{project.name}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>Basic information about your campaign</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  placeholder="Black Friday Sale"
                  {...register("name")}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="channel">Channel</Label>
                <select
                  id="channel"
                  {...register("channel")}
                  className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="discord">Discord</option>
                  <option value="slack">Slack</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="scheduledAt">Schedule (Optional)</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  {...register("scheduledAt")}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to send immediately after creation
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>Choose a template or write custom content</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="templateId">Template (Optional)</Label>
                <select
                  id="templateId"
                  {...register("templateId")}
                  className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">-- Custom Content --</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  If selected, subject/message from template will be used
                </p>
              </div>

              {!useTemplate && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Welcome to our platform!"
                      {...register("subject")}
                    />
                    {errors.subject && (
                      <p className="text-xs text-destructive">{errors.subject.message}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="message">Message</Label>
                    <textarea
                      id="message"
                      rows={6}
                      placeholder="Hello {{name}}, welcome to our platform..."
                      {...register("message")}
                      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    {errors.message && (
                      <p className="text-xs text-destructive">{errors.message.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Use {"{{name}}"}, {"{{email}}"} for personalization
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Variables */}
          {activeVariables.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Template Variables</CardTitle>
                <CardDescription>
                  These variables appear in your subject/body. Built-in variables like {"{{name}}"} and {"{{email}}"} are filled automatically; the ones below must be provided.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {activeVariables.map((variable) => (
                  <div key={variable} className="grid gap-2">
                    <Label htmlFor={`var-${variable}`}>{"{{"}{variable}{"}}"}</Label>
                    <Input
                      id={`var-${variable}`}
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
              </CardContent>
            </Card>
          )}

          {/* Filter Type */}
          <Card>
            <CardHeader>
              <CardTitle>Target Audience</CardTitle>
              <CardDescription>Choose how to select contacts</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="filterType">Filter Type</Label>
                <select
                  id="filterType"
                  {...register("filterType")}
                  className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="manual">Manual Selection</option>
                  <option value="all">All Contacts</option>
                  <option value="language">By Language</option>
                  <option value="tags">By Tags</option>
                </select>
              </div>

              {filterType === "language" && (
                <div className="grid gap-2">
                  <Label htmlFor="filterLanguage">Language Code</Label>
                  <Input
                    id="filterLanguage"
                    placeholder="en"
                    {...register("filterLanguage")}
                  />
                  <p className="text-xs text-muted-foreground">2-letter language code (e.g., en, es, fr)</p>
                </div>
              )}

              {filterType === "tags" && (
                <div className="grid gap-2">
                  <Label htmlFor="filterTags">Tags (comma-separated)</Label>
                  <Input
                    id="filterTags"
                    placeholder="premium, vip"
                    {...register("filterTags")}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Selection Table */}
          {filterType === "manual" && (
            <Card>
              <CardHeader>
                <CardTitle>Select Contacts</CardTitle>
                <CardDescription>
                  Choose which contacts will receive this campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                  >
                    {selectedContactIds.size === contacts.length ? (
                      <>
                        <Square className="mr-2 size-4" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <CheckSquare className="mr-2 size-4" />
                        Select All
                      </>
                    )}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {selectedContactIds.size} of {contacts.length} selected
                  </span>
                </div>

                {contacts.length === 0 ? (
                  <div className="rounded-lg bg-muted p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No contacts available. Add contacts to your project first.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full">
                      <thead className="border-b border-border bg-muted/50">
                        <tr>
                          <th className="w-12 px-4 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={selectedContactIds.size === contacts.length && contacts.length > 0}
                              onChange={toggleSelectAll}
                              className="size-4 cursor-pointer rounded border-gray-300"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            Email
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            Language
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            Tags
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {contacts.map((contact) => (
                          <tr
                            key={contact.id}
                            className={`hover:bg-muted/30 transition-colors ${
                              selectedContactIds.has(contact.id) ? "bg-muted/50" : ""
                            }`}
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedContactIds.has(contact.id)}
                                onChange={() => toggleSelect(contact.id)}
                                className="size-4 cursor-pointer rounded border-gray-300"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-foreground">
                              {contact.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {contact.email}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-800 uppercase">
                                {contact.language}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {contact.tags && contact.tags.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {contact.tags.slice(0, 2).map((tag) => (
                                    <span
                                      key={tag}
                                      className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {contact.tags.length > 2 && (
                                    <span className="text-xs text-muted-foreground">
                                      +{contact.tags.length - 2}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="rounded-lg bg-muted p-3 flex items-start gap-2">
            <Info className="size-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Campaign will be created as a draft. You can review and send it from the campaign detail page.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create Campaign
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/projects/${projectId}/campaigns`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
