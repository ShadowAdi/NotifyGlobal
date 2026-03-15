"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getContactById, updateContact } from "@/actions/contacts.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  updateContactSchema,
  type UpdateContactFormValues,
  commonLanguages,
} from "@/lib/validators/contact";
import { Loader2, ArrowLeft, Users, Info } from "lucide-react";
import type { Contact } from "@/types";

export default function EditContactPage() {
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateContactFormValues>({
    resolver: zodResolver(updateContactSchema),
    defaultValues: {
      name: "",
      email: "",
      language: "en",
      tags: "",
    },
  });

  useEffect(() => {
    if (contact) {
      reset({
        name: contact.name,
        email: contact.email,
        language: contact.language,
        tags: contact.tags ? contact.tags.join(", ") : "",
      });
    }
  }, [contact, reset]);

  const onSubmit = async (data: UpdateContactFormValues) => {
    if (!token) {
      toast.error("You must be logged in to edit a contact");
      return;
    }

    // Parse tags from comma-separated string
    const tagsArray = data.tags
      ? data.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      : [];

    const result = await updateContact(
      contactId,
      {
        name: data.name,
        email: data.email,
        language: data.language,
        tags: tagsArray.length > 0 ? tagsArray : null,
      },
      token
    );

    if (result.success) {
      toast.success("Contact updated successfully");
      router.push(`/projects/${projectId}/contacts/${contactId}`);
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

      <main className="mx-auto max-w-2xl px-6 py-10">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() =>
            router.push(`/projects/${projectId}/contacts/${contactId}`)
          }
          className="mb-6"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Contact
        </Button>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Edit Contact</h1>
          <p className="mt-1 text-muted-foreground">
            Update{" "}
            <span className="font-medium text-foreground">{contact.name}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Update contact details. All fields except tags are required.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  placeholder="John Doe"
                  {...register("name")}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="john@example.com"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-language">Language (2-letter code)</Label>
                <select
                  id="edit-language"
                  {...register("language")}
                  className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {commonLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name} ({lang.code})
                    </option>
                  ))}
                </select>
                {errors.language && (
                  <p className="text-xs text-destructive">
                    {errors.language.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-tags">Tags (optional)</Label>
                <Input
                  id="edit-tags"
                  placeholder="premium, beta, vip (comma-separated)"
                  {...register("tags")}
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple tags with commas
                </p>
              </div>

              <div className="rounded-lg bg-muted p-3 flex items-start gap-2">
                <Info className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Changes will be saved immediately when you submit.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                router.push(`/projects/${projectId}/contacts/${contactId}`)
              }
            >
              Cancel
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
