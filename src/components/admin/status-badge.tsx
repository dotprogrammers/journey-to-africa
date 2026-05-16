"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType =
  | "pending"
  | "confirmed"
  | "paid"
  | "completed"
  | "cancelled"
  | "refunded"
  | "initialized"
  | "success"
  | "failed"
  | "abandoned"
  | "sent"
  | "draft"
  | "void"
  | "queued";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-100",
  },
  paid: {
    label: "Paid",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
  },
  completed: {
    label: "Completed",
    className: "bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-100",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
  },
  refunded: {
    label: "Refunded",
    className: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100",
  },
  initialized: {
    label: "Initialized",
    className: "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-100",
  },
  success: {
    label: "Success",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
  },
  abandoned: {
    label: "Abandoned",
    className: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100",
  },
  sent: {
    label: "Sent",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
  },
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-100",
  },
  void: {
    label: "Void",
    className: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100",
  },
  queued: {
    label: "Queued",
    className: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: "bg-slate-100 text-slate-800 border-slate-200",
  };

  return (
    <Badge
      variant="outline"
      className={cn("capitalize font-medium text-xs", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
