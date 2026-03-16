"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
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
import { deleteEvent, getEventsByProject } from "@/actions";
import type { Event } from "@/types";
import { ArrowLeft, Calendar, Loader2, Plus, Trash2, Zap } from "lucide-react";

export default function EventsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();

  const projectId = params.projectId as string;

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!token || !projectId) return;
    setLoading(true);
    const res = await getEventsByProject(projectId, token, { limit: 100 });
    if (res.success) {
      setEvents(res.data.data);
    } else {
      toast.error(res.error || "Failed to load events");
    }
    setLoading(false);
  }, [token, projectId]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/sign-in");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (token && projectId) fetchEvents();
  }, [token, projectId, fetchEvents]);

  const sorted = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [events]);

  const handleDelete = async (id: string) => {
    if (!token) return;
    setDeletingId(id);
    const res = await deleteEvent(id, token);
    if (res.success) {
      toast.success("Event deleted");
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } else {
      toast.error(res.error || "Failed to delete event");
    }
    setDeletingId(null);
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

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => router.push(`/projects/${projectId}`)}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Project
          </Button>
          <Button onClick={() => router.push(`/projects/${projectId}/events/new`)}>
            <Plus className="mr-2 size-4" />
            New Event
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-5" />
              Events
            </CardTitle>
            <CardDescription>
              Events are triggered from your backend via the API and send an email to one recipient per call.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sorted.length === 0 ? (
              <div className="rounded-lg bg-muted p-8 text-center">
                <p className="text-sm text-muted-foreground">No events yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Event ID
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Content
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Created
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sorted.map((e) => (
                      <tr
                        key={e.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => router.push(`/projects/${projectId}/events/${e.id}`)}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-foreground">
                          {e.eventName}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                          {e.eventId}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ${
                              e.isActive
                                ? "bg-green-50 text-green-700 ring-green-200 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-800"
                                : "bg-gray-100 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700"
                            }`}
                          >
                            {e.isActive ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {e.templateId ? "Template" : "Inline"}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="size-3.5" />
                            {new Date(e.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(ev) => ev.stopPropagation()}>
                          <AlertDialog>
                            <AlertDialogTrigger
                              render={
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={deletingId === e.id}
                                >
                                  {deletingId === e.id ? (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="mr-2 size-4" />
                                  )}
                                  Delete
                                </Button>
                              }
                            />
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete event?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove <strong>{e.eventName}</strong> and stop future triggers for{" "}
                                  <span className="font-mono">{e.eventId}</span>.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(e.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

