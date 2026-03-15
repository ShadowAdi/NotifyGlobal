"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getProjectById } from "@/actions/project.action";
import { getContactsByProject, bulkDeleteContacts } from "@/actions/contacts.action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BulkUploadContactsDialog } from "@/components/contacts/bulk-upload-dialog";
import {
  Loader2,
  ArrowLeft,
  Users,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Pencil,
} from "lucide-react";
import type { Project, Contact } from "@/types";

export default function ContactsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectId = params.projectId as string;

  const fetchData = useCallback(async () => {
    if (!token || !projectId) return;
    setLoading(true);
    setError(null);

    const [projectResult, contactsResult] = await Promise.all([
      getProjectById(projectId, token),
      getContactsByProject(projectId, token, { limit: 500 }),
    ]);

    if (projectResult.success) {
      setProject(projectResult.data);
    } else {
      setError(projectResult.error);
    }

    if (contactsResult.success) {
      setContacts(contactsResult.data.data);
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

  const toggleSelectAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map((c) => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    const confirmed = confirm(
      `Are you sure you want to delete ${selectedIds.size} contact(s)? This action cannot be undone.`
    );
    
    if (!confirmed || !token) return;

    setDeleting(true);
    const result = await bulkDeleteContacts(Array.from(selectedIds), token);
    
    if (result.success) {
      toast.success(`${selectedIds.size} contact(s) deleted successfully`);
      setSelectedIds(new Set());
      fetchData();
    } else {
      toast.error(result.error);
    }
    setDeleting(false);
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
              <Users className="mb-4 size-12 text-muted-foreground" />
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
            <h1 className="text-3xl font-bold text-foreground">Contacts</h1>
            <p className="mt-1 text-muted-foreground">
              Manage contacts for{" "}
              <span className="font-medium text-foreground">
                {project.name}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BulkUploadContactsDialog
              projectId={projectId}
              onContactsUploaded={fetchData}
            />
            <Button onClick={() => router.push(`/projects/${projectId}/contacts/new`)}>
              <Plus className="mr-2 size-4" />
              New Contact
            </Button>
          </div>
        </div>

        {/* Bulk actions */}
        {contacts.length > 0 && (
          <div className="mb-4 flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
            >
              {selectedIds.size === contacts.length ? (
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
            {selectedIds.size > 0 && (
              <>
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 size-4" />
                  )}
                  Delete Selected
                </Button>
              </>
            )}
          </div>
        )}

        {/* Contacts table */}
        {contacts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="mb-4 size-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">
                No contacts yet
              </h3>
              <p className="mt-1 mb-4 text-sm text-muted-foreground">
                Add your first contact or bulk upload from CSV.
              </p>
              <div className="flex items-center gap-2">
                <BulkUploadContactsDialog
                  projectId={projectId}
                  onContactsUploaded={fetchData}
                />
                <Button onClick={() => router.push(`/projects/${projectId}/contacts/new`)}>
                  <Plus className="mr-2 size-4" />
                  New Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="w-12 px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === contacts.length && contacts.length > 0}
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
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Created
                    </th>
                    <th className="w-20 px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {contacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        selectedIds.has(contact.id) ? "bg-muted/50" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(contact.id)}
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
                            {contact.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700"
                              >
                                {tag}
                              </span>
                            ))}
                            {contact.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{contact.tags.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/projects/${projectId}/contacts/${contact.id}/edit`
                            )
                          }
                        >
                          <Pencil className="size-3.5" />
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
