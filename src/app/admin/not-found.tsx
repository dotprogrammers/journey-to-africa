import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="text-center max-w-md">
        <h2 className="text-6xl font-bold text-slate-200 mb-4">404</h2>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          Page Not Found
        </h3>
        <p className="text-muted-foreground mb-6">
          The admin page you are looking for does not exist or has been moved.
        </p>
        <Button asChild className="bg-slate-900 text-white hover:bg-slate-800">
          <Link href="/admin">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
