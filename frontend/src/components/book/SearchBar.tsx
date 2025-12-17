'use client';
import { Search, X } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

interface SearchBarProps {
  initialValue: string;
  onSearch: (value: string) => void;
  onClear: () => void;
  debounceMs?: number; // Default 500ms
}

export const SearchBar = ({
  initialValue,
  onSearch,
  onClear,
  debounceMs = 500
}: SearchBarProps) => {
  const [input, setInput] = useState(initialValue);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync khi URL thay đổi từ bên ngoài
  useEffect(() => {
    setInput(initialValue);
  }, [initialValue]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Debounced search handler
  const handleInputChange = useCallback((value: string) => {
    setInput(value);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout for debounced search
    debounceRef.current = setTimeout(() => {
      if (value.trim()) {
        onSearch(value);
      }
    }, debounceMs);
  }, [onSearch, debounceMs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Clear debounce and search immediately on submit
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    onSearch(input);
  };

  const handleClear = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setInput('');
    onClear();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-10 max-w-3xl mx-auto relative group"
    >
      <input
        type="text"
        value={input}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder="Tìm kiếm tên truyện, tác giả..."
        className="block w-full pl-5 pr-12 py-4 rounded-full bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600/50 shadow-lg backdrop-blur-sm transition-all"
      />
      {(input || initialValue) && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-red-500 transition-colors"
        >
          <X size={20} />
        </button>
      )}
    </form>
  );
};
