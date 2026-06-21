'use client';
import { X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchBarProps {
  initialValue: string;
  onSearch: (value: string) => void;
  onClear: () => void;
  debounceMs?: number;
  compact?: boolean;
}

export const SearchBar = ({
  initialValue,
  onSearch,
  onClear,
  debounceMs = 500,
  compact = false,
}: SearchBarProps) => {
  const [input, setInput] = useState(initialValue);
  const debouncedInput = useDebounce(input, debounceMs);
  const isComposing = useRef(false);
  const lastSearchedValue = useRef(initialValue);

  useEffect(() => {
    setInput(initialValue);
    lastSearchedValue.current = initialValue;
  }, [initialValue]);

  useEffect(() => {
    if (isComposing.current) return;

    const trimmedInput = debouncedInput.trim();
    const trimmedLast = lastSearchedValue.current.trim();

    if (trimmedInput !== trimmedLast) {
      if (trimmedInput) {
        onSearch(debouncedInput);
      } else {
        onClear();
      }
      lastSearchedValue.current = debouncedInput;
    }
  }, [debouncedInput, onSearch, onClear]);

  const handleCompositionStart = () => {
    isComposing.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposing.current = false;
    const value = e.currentTarget.value;
    setInput(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(input);
    lastSearchedValue.current = input;
  };

  const handleClear = () => {
    setInput('');
    onClear();
    lastSearchedValue.current = '';
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={compact ? 'relative flex-1' : 'max-w-3xl mx-auto relative group'}
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        placeholder="Tìm kiếm tên truyện, tác giả..."
        className={
          compact
            ? 'block w-full pl-4 pr-10 py-2.5 rounded-full bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all text-sm'
            : 'block w-full pl-5 pr-12 py-4 rounded-full bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/50 shadow-lg backdrop-blur-sm transition-all'
        }
      />
      {input && (
        <button
          type="button"
          onClick={handleClear}
          className={`absolute inset-y-0 flex items-center text-gray-400 hover:text-brand transition-colors ${
            compact ? 'right-3' : 'right-4'
          }`}
        >
          <X size={compact ? 16 : 20} />
        </button>
      )}
    </form>
  );
};
