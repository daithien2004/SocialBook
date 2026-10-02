'use client';

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppLoadingProps {
  className?: string;
  size?: number | string;
  text?: string;
}

export function AppLoading({ className, size = 20, text }: AppLoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <Loader2 
        className="animate-spin text-primary" 
        size={size} 
      />
      {text ? <span className="text-sm text-muted-foreground font-medium">{text}</span> : null}
    </div>
  );
}

export function FullScreenSpinner({ className = "min-h-screen" }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="size-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
    </div>
  );
}
