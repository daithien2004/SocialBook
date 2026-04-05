'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  disabled?: boolean;
}

export function ChatInput({ value, onChange, onSubmit, disabled }: ChatInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 w-full bg-gray-50 dark:bg-zinc-900 p-2 rounded-2xl border border-transparent focus-within:border-blue-500/30 focus-within:bg-white dark:focus-within:bg-zinc-800 transition-all"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-10 text-muted-foreground rounded-xl hover:bg-gray-100"
      >
        <Plus className="w-5 h-5" />
      </Button>
      <Input
        placeholder="Nhập tin nhắn của bạn..."
        className="border-none bg-transparent h-10 px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm font-medium"
        value={value}
        onChange={handleChange}
        disabled={disabled}
      />
      <Button
        type="submit"
        size="icon"
        className={`h-10 w-10 rounded-xl transition-all ${
          value.trim()
            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg active:scale-95'
            : 'bg-transparent text-muted-foreground'
        }`}
        disabled={!value.trim() || disabled}
      >
        <Send className="w-5 h-5" />
      </Button>
    </form>
  );
}

function Plus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function Send(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}
