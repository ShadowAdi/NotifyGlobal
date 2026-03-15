"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  LogOut,
  FolderOpen,
  Mail,
  Users,
  BarChart3,
} from "lucide-react";

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/sign-in");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const stats = [
    { label: "Projects", value: "—", icon: FolderOpen },
    { label: "Templates", value: "—", icon: Mail },
    { label: "Contacts", value: "—", icon: Users },
    { label: "Campaigns", value: "—", icon: BarChart3 },
  ];

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

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user.name ?? user.email}
            </span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="mr-2 size-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back, {user.name ?? "there"}!
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty state */}
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="mb-4 size-12 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">
              No projects yet
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first project to start sending multilingual
              notifications.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
