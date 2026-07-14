'use client';
import { X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useRecordSearchKeywordMutation } from '@/features/books/api/bookApi';

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
  const [recordSearchKeyword] = useRecordSearchKeywordMutation();
  const isComposing = useRef(false);
  const lastSearchedValue = useRef(initialValue);
  const onSearchRef = useRef(onSearch);
  const onClearRef = useRef(onClear);
  
  useEffect(() => {
    onSearchRef.current = onSearch;
    onClearRef.current = onClear;
  }, [onSearch, onClear]);

  const userCleared = useRef(false);

  useEffect(() => {
    if (userCleared.current) {
      userCleared.current = false;
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInput(initialValue);
    lastSearchedValue.current = initialValue;
  }, [initialValue]);

  useEffect(() => {
    if (isComposing.current) return;

    const trimmedInput = debouncedInput.trim();
    const trimmedLast = lastSearchedValue.current.trim();

    if (trimmedInput !== trimmedLast) {
      if (trimmedInput) {
        onSearchRef.current(debouncedInput);
      } else {
        onClearRef.current();
      }
      lastSearchedValue.current = debouncedInput;
    }
  }, [debouncedInput]);

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
    const trimmed = input.trim();
    if (trimmed) {
      recordSearchKeyword(trimmed);
    }
    onSearchRef.current(input);
    lastSearchedValue.current = input;
  };

  const handleClear = () => {
    userCleared.current = true;
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
            ? 'block w-full pl-4 pr-10 py-2.5 rounded-full bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm placeholder:text-muted-foreground'
            : 'block w-full pl-5 pr-12 py-4 rounded-full bg-transparent border-none text-foreground focus:outline-none focus:ring-0 transition-all placeholder:text-muted-foreground'
        }
      />
      {input && (
        <button
          type="button"
          onClick={handleClear}
          className={`absolute inset-y-0 flex items-center text-muted-foreground hover:text-foreground transition-colors ${
            compact ? 'right-3' : 'right-4'
          }`}
        >
          <X size={compact ? 16 : 20} />
        </button>
      )}
    </form>
  );
};
