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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { createApiKey, DeleteApiKey, GetAllKeys } from "@/actions";
import type { ApiKey } from "@/types";
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Plus, Trash2, Copy } from "lucide-react";

export default function ApiKeysPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();

  const projectId = params.projectId as string;

  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newExpiresAt, setNewExpiresAt] = useState<string>("");

  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const fetchKeys = useCallback(async () => {
    if (!token || !projectId) return;
    setLoading(true);
    const res = await GetAllKeys(token, projectId);
    if (res.success) {
      setKeys(res.data);
    } else {
      toast.error(res.error || "Failed to load API keys");
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
      fetchKeys();
    }
  }, [token, projectId, fetchKeys]);

  const sortedKeys = useMemo(() => {
    return [...keys].sort((a, b) => {
      const at = new Date(a.createdAt).getTime();
      const bt = new Date(b.createdAt).getTime();
      return bt - at;
    });
  }, [keys]);

  const maskKey = (key: string) => {
    if (!key) return "—";
    const visible = 6;
    if (key.length <= visible) return "••••••";
    return `••••••••••••${key.slice(-visible)}`;
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleCreate = async () => {
    if (!token) return;
    if (!newName.trim()) {
      toast.error("Name is required");
      return;
    }
    setCreating(true);
    const expiresAt = newExpiresAt ? new Date(newExpiresAt) : undefined;
    const res = await createApiKey({ projectId, name: newName.trim(), expiresAt }, token);
    if (res.success) {
      toast.success("API key created");
      setCreateOpen(false);
      setNewName("");
      setNewExpiresAt("");
      await fetchKeys();
      // Reveal the newly created key once (common UX for API keys)
      setRevealed((prev) => ({ ...prev, [res.data.id]: true }));
    } else {
      toast.error(res.error || "Failed to create API key");
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    setDeletingId(id);
    const res = await DeleteApiKey(token, id);
    if (res.success) {
      toast.success("API key deleted");
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } else {
      toast.error(res.error || "Failed to delete API key");
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

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger
              render={
                <Button>
                  <Plus className="mr-2 size-4" />
                  New API Key
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create API Key</DialogTitle>
                <DialogDescription>
                  Give your key a name. You can optionally set an expiry date.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="api-key-name">Name</Label>
                  <Input
                    id="api-key-name"
                    placeholder="e.g. Production backend"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="api-key-exp">Expires at (optional)</Label>
                  <Input
                    id="api-key-exp"
                    type="datetime-local"
                    value={newExpiresAt}
                    onChange={(e) => setNewExpiresAt(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Keys are hidden by default. Reveal/copy when needed. (No editing — create a new key instead.)
            </CardDescription>
          </CardHeader>

          <CardContent>
            {sortedKeys.length === 0 ? (
              <div className="rounded-lg bg-muted p-8 text-center">
                <p className="text-sm text-muted-foreground">No API keys yet.</p>
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
                        Key
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Expires
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sortedKeys.map((k) => {
                      const isRevealed = !!revealed[k.id];
                      const keyText = isRevealed ? k.key : maskKey(k.key);
                      return (
                        <tr key={k.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-foreground">
                            {k.name}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <code className="text-xs text-muted-foreground break-all">
                                {keyText}
                              </code>
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                onClick={() =>
                                  setRevealed((prev) => ({ ...prev, [k.id]: !isRevealed }))
                                }
                                aria-label={isRevealed ? "Hide key" : "Reveal key"}
                              >
                                {isRevealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                              </Button>
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => handleCopy(k.key)}
                                aria-label="Copy key"
                              >
                                <Copy className="size-4" />
                              </Button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {new Date(k.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {k.expiresAt ? new Date(k.expiresAt).toLocaleString() : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <AlertDialog>
                              <AlertDialogTrigger
                                render={
                                  <Button variant="destructive" size="sm" disabled={deletingId === k.id}>
                                    {deletingId === k.id ? (
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
                                  <AlertDialogTitle>Delete API key?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently revoke <strong>{k.name}</strong>.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(k.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </td>
                        </tr>
                      );
                    })}
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

