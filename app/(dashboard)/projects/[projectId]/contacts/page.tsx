"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getProjectById } from "@/actions/project.action";
import { getContactsByProject } from "@/actions/contacts.action";
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
  Mail,
  Languages,
  Tag,
  ArrowRight,
} from "lucide-react";
import type { Project, Contact } from "@/types";

export default function ContactsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = params.projectId as string;

  const fetchData = useCallback(async () => {
    if (!token || !projectId) return;
    setLoading(true);
    setError(null);

    const [projectResult, contactsResult] = await Promise.all([
      getProjectById(projectId, token),
      getContactsByProject(projectId, token, { limit: 100 }),
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
        <div className="mb-8 flex items-center justify-between">
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

        {/* Contacts list */}
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contacts.map((contact) => (
              <Card
                key={contact.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() =>
                  router.push(`/projects/${projectId}/contacts/${contact.id}`)
                }
              >
                <CardHeader>
                  <CardTitle className="line-clamp-1">{contact.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5 line-clamp-1">
                    <Mail className="size-3" />
                    {contact.email}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Languages className="size-3.5" />
                    <span className="uppercase">{contact.language}</span>
                  </div>
                  {contact.tags && contact.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1">
                      <Tag className="size-3 text-muted-foreground" />
                      {contact.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                      {contact.tags.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{contact.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
