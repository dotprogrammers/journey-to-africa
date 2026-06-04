"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-slate-50">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Oops!</h1>
        <p className="text-muted-foreground mb-6">
          Something unexpected happened. We apologize for the inconvenience.
        </p>
        <Button onClick={reset} className="bg-slate-900 text-white hover:bg-slate-800">
          Try again
        </Button>
      </div>
    </div>
  );
}
