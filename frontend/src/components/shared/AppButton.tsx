'use client';

import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

const AppButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
  ({ className, loading, loadingText, children, disabled, ...props }, ref) => {
    return (
      <Button
        className={cn("relative", className)}
        disabled={loading || disabled}
        ref={ref}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);

AppButton.displayName = "AppButton";

export { AppButton };
