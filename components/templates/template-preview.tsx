"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface TemplatePreviewProps {
  subject: string;
  body: string;
  className?: string;
}

/**
 * Detects if a string contains HTML tags
 */
function isHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

/**
 * Highlights {{variables}} in text with a styled badge
 */
function highlightVariables(text: string): string {
  return text.replace(
    /\{\{([^}]+)\}\}/g,
    '<span style="background:#dbeafe;color:#1d4ed8;padding:1px 6px;border-radius:4px;font-size:0.85em;font-family:monospace">{{$1}}</span>'
  );
}

export function TemplatePreview({
  subject,
  body,
  className,
}: TemplatePreviewProps) {
  const bodyIsHtml = useMemo(() => isHtml(body), [body]);

  const renderedSubject = useMemo(
    () => highlightVariables(subject || ""),
    [subject]
  );

  const renderedBody = useMemo(() => {
    if (!body) return "";
    if (bodyIsHtml) {
      return highlightVariables(body);
    }
    // Plain text: convert newlines to <br> and highlight variables
    const escaped = body
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br />");
    return highlightVariables(escaped);
  }, [body, bodyIsHtml]);

  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
      {/* Email header */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Subject:</span>
          <span
            dangerouslySetInnerHTML={{ __html: renderedSubject || "—" }}
          />
        </div>
      </div>

      {/* Badge showing content type */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
            bodyIsHtml
              ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          )}
        >
          {bodyIsHtml ? "HTML" : "Plain Text"}
        </span>
      </div>

      {/* Email body */}
      <div className="p-4">
        {bodyIsHtml ? (
          <iframe
            srcDoc={`
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6; color: #333; }
                  img { max-width: 100%; height: auto; }
                  a { color: #2563eb; }
                </style>
              </head>
              <body>${renderedBody}</body>
              </html>
            `}
            className="w-full rounded border-0 bg-white"
            style={{ minHeight: "200px", height: "400px" }}
            sandbox="allow-same-origin"
            title="Template Preview"
          />
        ) : (
          <div
            className="prose prose-sm max-w-none text-sm text-foreground"
            dangerouslySetInnerHTML={{ __html: renderedBody || '<span class="text-muted-foreground">No content</span>' }}
          />
        )}
      </div>
    </div>
  );
}
