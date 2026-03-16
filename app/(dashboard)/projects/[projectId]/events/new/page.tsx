"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createEvent, getTemplatesByProject } from "@/actions";
import type { Template } from "@/types";
import { ArrowLeft, Loader2, Zap } from "lucide-react";

function normalizeEventId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export default function NewEventPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();

  const projectId = params.projectId as string;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [eventName, setEventName] = useState("");
  const [eventId, setEventId] = useState("");
  const [description, setDescription] = useState("");
  const [templateId, setTemplateId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isActive, setIsActive] = useState(true);

  const usingTemplate = !!templateId;

  const fetchData = useCallback(async () => {
    if (!token || !projectId) return;
    setLoading(true);
    const tpl = await getTemplatesByProject(projectId, token, { limit: 200 });
    if (tpl.success) setTemplates(tpl.data.data);
    setLoading(false);
  }, [token, projectId]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/sign-in");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (token && projectId) fetchData();
  }, [token, projectId, fetchData]);

  const canSave = useMemo(() => {
    if (!eventName.trim()) return false;
    if (!normalizeEventId(eventId)) return false;
    if (!usingTemplate && (!subject.trim() || !message.trim())) return false;
    return true;
  }, [eventName, eventId, usingTemplate, subject, message]);

  const handleCreate = async () => {
    if (!token) return;
    const normalized = normalizeEventId(eventId);
    if (!eventName.trim() || !normalized) {
      toast.error("Event name and event ID are required");
      return;
    }
    if (!usingTemplate && (!subject.trim() || !message.trim())) {
      toast.error("Provide a template OR both subject and message");
      return;
    }

    setSaving(true);
    const res = await createEvent(
      {
        projectId,
        eventName: eventName.trim(),
        eventId: normalized,
        description: description.trim() || undefined,
        templateId: usingTemplate ? templateId : undefined,
        subject: usingTemplate ? undefined : subject,
        message: usingTemplate ? undefined : message,
        channel: "email",
        isActive,
      },
      token
    );

    if (res.success) {
      toast.success("Event created");
      router.push(`/projects/${projectId}/events/${res.data.id}`);
    } else {
      toast.error(res.error || "Failed to create event");
    }
    setSaving(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
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

      <main className="mx-auto max-w-3xl px-6 py-10">
        <Button variant="ghost" onClick={() => router.push(`/projects/${projectId}/events`)} className="mb-6">
          <ArrowLeft className="mr-2 size-4" />
          Back to Events
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">New Event</h1>
          <p className="mt-1 text-muted-foreground">
            Create an event your backend can trigger to send one email.
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="size-5" />
                Event Details
              </CardTitle>
              <CardDescription>Choose a stable event ID like <span className="font-mono">user_signup</span>.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="evt-name">Event name</Label>
                <Input
                  id="evt-name"
                  placeholder="User Signup"
                  value={eventName}
                  onChange={(e) => {
                    setEventName(e.target.value);
                    if (!eventId.trim()) setEventId(normalizeEventId(e.target.value));
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="evt-id">Event ID (used by API calls)</Label>
                <Input
                  id="evt-id"
                  placeholder="user_signup"
                  value={eventId}
                  onChange={(e) => setEventId(normalizeEventId(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Only letters, numbers, and underscores.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="evt-desc">Description (optional)</Label>
                <Textarea
                  id="evt-desc"
                  rows={3}
                  placeholder="Sent when a user finishes signup"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 size-4"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span>Active (can be triggered by API)</span>
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
              <CardDescription>Use a template, or write inline subject + message.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="evt-template">Template (optional)</Label>
                <select
                  id="evt-template"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">-- Inline content --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {!usingTemplate && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="evt-subject">Subject</Label>
                    <Input
                      id="evt-subject"
                      placeholder="Welcome, {{name}}!"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="evt-message">Message</Label>
                    <Textarea
                      id="evt-message"
                      rows={8}
                      placeholder={"Hi {{name}},\n\nYour custom content with {{variables}}"}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your backend can pass values for any custom variables in the{" "}
                      <span className="font-mono">variables</span> field of the trigger API payload.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button onClick={handleCreate} disabled={!canSave || saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create Event
            </Button>
            <Button variant="outline" onClick={() => router.push(`/projects/${projectId}/events`)}>
              Cancel
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

