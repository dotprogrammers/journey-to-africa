"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-muted-foreground mb-6">
          An unexpected error occurred in the admin panel. Please try again.
        </p>
        <Button onClick={reset} className="bg-slate-900 text-white hover:bg-slate-800">
          Try again
        </Button>
      </div>
    </div>
  );
}
