"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: "green" | "yellow" | "blue" | "purple" | "red";
  subtitle?: string;
}

const colorMap = {
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  yellow: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  blue: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
  purple: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
  red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const iconBgMap = {
  green: "bg-emerald-500/10 text-emerald-600",
  yellow: "bg-amber-500/10 text-amber-600",
  blue: "bg-sky-500/10 text-sky-600",
  purple: "bg-violet-500/10 text-violet-600",
  red: "bg-red-500/10 text-red-600",
};

export function StatsCard({ title, value, icon: Icon, color, subtitle }: StatsCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className={cn("text-xs font-medium", colorMap[color])}>
                {subtitle}
              </p>
            )}
          </div>
          <div className={cn("rounded-lg p-3", iconBgMap[color])}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
