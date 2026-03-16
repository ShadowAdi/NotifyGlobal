"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { getEventById, updateEvent, deleteEvent, getTemplateById } from "@/actions";
import type { Event } from "@/types";
import { ArrowLeft, Copy, Loader2, Trash2, Zap } from "lucide-react";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();

  const projectId = params.projectId as string;
  const eventDbId = params.eventDbId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [templateVars, setTemplateVars] = useState<string[] | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!token || !eventDbId) return;
    setLoading(true);
    const res = await getEventById(eventDbId, token);
    if (res.success) {
      setEvent(res.data);
      setEventName(res.data.eventName);
      setDescription(res.data.description ?? "");
      setIsActive(res.data.isActive);

      if (res.data.templateId) {
        const tpl = await getTemplateById(res.data.templateId, token);
        if (tpl.success) setTemplateVars(tpl.data.variables ?? []);
      } else {
        setTemplateVars(null);
      }
    } else {
      toast.error(res.error || "Event not found");
    }
    setLoading(false);
  }, [token, eventDbId]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/sign-in");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (token && eventDbId) fetchEvent();
  }, [token, eventDbId, fetchEvent]);

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const triggerExample = useMemo(() => {
    if (!event) return "";
    return `curl -X POST \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "eventId": "${event.eventId}",
    "email": "user@example.com",
    "name": "John",
    "language": "en",
    "variables": {
      "link": "https://example.com/reset"
    }
  }' \\
  https://YOUR_DOMAIN.com/api/events/trigger`;
  }, [event]);

  const builtinVars = new Set([
    "name",
    "email",
    "language",
    "discord_username",
    "discordUsername",
  ]);

  const requiredVars = useMemo(() => {
    return (templateVars ?? []).filter((v) => v && !builtinVars.has(v));
  }, [templateVars]);

  const handleSave = async () => {
    if (!token || !event) return;
    setSaving(true);
    const res = await updateEvent(
      event.id,
      {
        eventName: eventName.trim() || event.eventName,
        description: description.trim() || null,
        isActive,
      },
      token
    );
    if (res.success) {
      toast.success("Event updated");
      setEvent(res.data);
    } else {
      toast.error(res.error || "Failed to update event");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!token || !event) return;
    setDeleting(true);
    const res = await deleteEvent(event.id, token);
    if (res.success) {
      toast.success("Event deleted");
      router.push(`/projects/${projectId}/events`);
      return;
    }
    toast.error(res.error || "Failed to delete event");
    setDeleting(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !event) return null;

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

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => router.push(`/projects/${projectId}/events`)}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Events
          </Button>

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="destructive" disabled={deleting}>
                  {deleting ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 size-4" />
                  )}
                  Delete Event
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete event?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete <strong>{event.eventName}</strong>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="size-5" />
                Event
              </CardTitle>
              <CardDescription>
                Event ID used by your backend:{" "}
                <span className="font-mono">{event.eventId}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="evt-name">Name</Label>
                <Input id="evt-name" value={eventName} onChange={(e) => setEventName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="evt-desc">Description</Label>
                <Textarea
                  id="evt-desc"
                  rows={3}
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
                <span>Active (triggerable)</span>
              </label>

              <div className="flex items-center gap-3">
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trigger from your backend</CardTitle>
              <CardDescription>
                Call the trigger endpoint with your API key. One call = one email.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="rounded-lg border bg-muted/30 p-3">
                <pre className="whitespace-pre-wrap text-xs">{triggerExample}</pre>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleCopy(triggerExample)}>
                  <Copy className="mr-2 size-4" />
                  Copy curl
                </Button>
              </div>

              {event.templateId && (
                <div className="grid gap-1">
                  <p className="text-sm font-medium">Template variables</p>
                  <p className="text-xs text-muted-foreground">
                    Built-ins like{" "}
                    <span className="font-mono">
                      {"{{name}}"}
                    </span>{" "}
                    and{" "}
                    <span className="font-mono">
                      {"{{email}}"}
                    </span>{" "}
                    are automatic. Any extra variables must be sent in{" "}
                    <span className="font-mono">variables</span>.
                  </p>
                  {requiredVars.length > 0 ? (
                    <p className="text-xs text-muted-foreground font-mono">
                      {requiredVars.map((v) => `{{${v}}}`).join(", ")}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">No extra variables detected.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

