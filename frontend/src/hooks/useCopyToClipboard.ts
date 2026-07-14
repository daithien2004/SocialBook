import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useCopyToClipboard() {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copy = useCallback(async (text: string, successMessage = 'Đã sao chép vào bộ nhớ tạm!') => {
    if (!navigator?.clipboard) {
      toast.error('Trình duyệt không hỗ trợ sao chép vào bộ nhớ tạm');
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      if (successMessage) {
        toast.success(successMessage);
      }
      return true;
    } catch {
      toast.error('Sao chép thất bại');
      setCopiedText(null);
      return false;
    }
  }, []);

  return { copiedText, copy };
}
