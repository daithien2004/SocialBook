'use client';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `ErrorBoundary caught an error in ${this.props.name || 'Component'}:`,
      error,
      errorInfo
    );
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 my-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-2xl">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Đã xảy ra lỗi hiển thị
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Không thể hiển thị nội dung này do lỗi hệ thống.
            </p>
          </div>
          <Button
            size="sm"
            onClick={this.handleReset}
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold gap-2"
          >
            <RefreshCw size={12} />
            Thử lại
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
