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
