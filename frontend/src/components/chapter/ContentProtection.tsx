"use client";

import React, { useEffect, useRef } from "react";
import { toast } from "sonner";

interface ContentProtectionProps {
  children: React.ReactNode;
  className?: string;
}

export default function ContentProtection({
  children,
  className = "",
}: ContentProtectionProps) {
  const isProtectionEnabled =
    process.env.NEXT_PUBLIC_ENABLE_CONTENT_PROTECTION === "true" ||
    (process.env.NODE_ENV === "production" &&
      process.env.NEXT_PUBLIC_ENABLE_CONTENT_PROTECTION !== "false");

  const protectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isProtectionEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Chặn lệnh In (Ctrl+P / Cmd+P) — áp dụng toàn trang
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        toast.warning("Hành động in tài liệu bị vô hiệu hóa để bảo vệ bản quyền.");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isProtectionEnabled]);

  if (!isProtectionEnabled) {
    return <div className={className}>{children}</div>;
  }

  const isInsideProtectedArea = (nativeTarget: EventTarget | null): boolean => {
    if (!protectedRef.current || !nativeTarget) return false;
    return protectedRef.current.contains(nativeTarget as Node);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isInsideProtectedArea(e.nativeEvent.target)) return;
    e.preventDefault();
    toast.warning("Bạn không thể sử dụng chuột phải ở khu vực này.");
  };

  const preventCopyEvent = (e: React.ClipboardEvent | React.KeyboardEvent) => {
    if (!isInsideProtectedArea(e.nativeEvent.target)) return;
    e.preventDefault();
    try {
      navigator.clipboard.writeText("");
    } catch {
      // ignore
    }
    toast.warning("Hành động sao chép bị vô hiệu hóa để bảo vệ bản quyền.");
  };

  return (
    <div
      ref={protectedRef}
      className={`relative ${className}`}
      onContextMenu={handleContextMenu}
      onCopy={preventCopyEvent}
      onCut={preventCopyEvent}
      onPaste={preventCopyEvent}
      onKeyDown={(e) => {
        if (
          (e.ctrlKey || e.metaKey) &&
          (e.key.toLowerCase() === "c" || e.key.toLowerCase() === "x")
        ) {
          preventCopyEvent(e);
        }
      }}
    >
      {children}
    </div>
  );
}
