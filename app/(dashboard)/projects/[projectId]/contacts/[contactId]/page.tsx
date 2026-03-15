"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getContactById } from "@/actions/contacts.action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeleteContactDialog } from "@/components/contacts/delete-contact-dialog";
import {
  Loader2,
  ArrowLeft,
  Users,
  Mail,
  Languages,
  Tag,
  Calendar,
  Pencil,
} from "lucide-react";
import type { Contact } from "@/types";

export default function ContactPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = params.projectId as string;
  const contactId = params.contactId as string;

  const fetchContact = useCallback(async () => {
    if (!token || !contactId) return;
    setLoading(true);
    setError(null);

    const result = await getContactById(contactId, token);

    if (result.success) {
      setContact(result.data);
    } else {
      setError(result.error);
    }

    setLoading(false);
  }, [token, contactId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/sign-in");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (token && contactId) {
      fetchContact();
    }
  }, [token, contactId, fetchContact]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (error || !contact) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <Button
            variant="ghost"
            onClick={() => router.push(`/projects/${projectId}/contacts`)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to Contacts
          </Button>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="mb-4 size-12 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">
                Contact not found
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {error || "The contact you're looking for doesn't exist."}
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

      <main className="mx-auto max-w-4xl px-6 py-10">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.push(`/projects/${projectId}/contacts`)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Contacts
        </Button>

        {/* Contact header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-foreground">
              {contact.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                Created {new Date(contact.createdAt).toLocaleDateString()}
              </span>
              {contact.updatedAt && contact.updatedAt !== contact.createdAt && (
                <span className="flex items-center gap-1.5">
                  Updated {new Date(contact.updatedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(
                  `/projects/${projectId}/contacts/${contactId}/edit`
                )
              }
            >
              <Pencil className="mr-2 size-4" />
              Edit
            </Button>
            <DeleteContactDialog
              contactId={contact.id}
              contactName={contact.name}
              onContactDeleted={() =>
                router.push(`/projects/${projectId}/contacts`)
              }
            />
          </div>
        </div>

        {/* Contact details */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{contact.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Languages className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Language</p>
                  <p className="text-sm font-medium uppercase">
                    {contact.language}
                  </p>
                </div>
              </div>

              {contact.tags && contact.tags.length > 0 && (
                <div className="flex items-start gap-3">
                  <Tag className="size-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {contact.tags.map((tag) => (
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

              {!contact.tags || contact.tags.length === 0 && (
                <div className="flex items-center gap-3">
                  <Tag className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tags</p>
                    <p className="text-sm text-muted-foreground">No tags</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
