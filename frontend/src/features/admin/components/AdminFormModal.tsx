'use client';

import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Upload, X } from 'lucide-react';
import Image from 'next/image';

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'image';
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  rows?: number;
}

interface AdminFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  isLoading: boolean;
  fields: FormField[];
  initialValues?: Record<string, string>;
  onSubmit: (values: Record<string, string>, files: Record<string, File | null>) => Promise<void>;
  submitLabel?: string;
  size?: 'default' | 'lg';
}

const DEFAULT_AVATAR = '/default-avatar.png';

export function AdminFormModal({
  isOpen,
  onClose,
  title,
  icon,
  isLoading,
  fields,
  initialValues = {},
  onSubmit,
  submitLabel = 'Lưu',
  size = 'default',
}: AdminFormModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      const initialForm: Record<string, string> = {};
      const initialFiles: Record<string, File | null> = {};
      const initialPreviews: Record<string, string> = {};

      fields.forEach((field) => {
        if (field.type === 'image') {
          initialFiles[field.key] = null;
          initialPreviews[field.key] = initialValues[field.key] || DEFAULT_AVATAR;
        } else {
          initialForm[field.key] = initialValues[field.key] || '';
        }
      });

      queueMicrotask(() => {
        setFormData(initialForm);
        setFiles(initialFiles);
        setPreviews(initialPreviews);
      });
    }
  }, [isOpen, fields, initialValues]);

  const handleImageUpload = useCallback((key: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    setFiles((prev) => ({ ...prev, [key]: file }));

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviews((prev) => ({ ...prev, [key]: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleClearImage = useCallback((key: string) => {
    setFiles((prev) => ({ ...prev, [key]: null }));
    setPreviews((prev) => ({ ...prev, [key]: initialValues[key] || DEFAULT_AVATAR }));
  }, [initialValues]);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData, files);
  };

  const hasImage = fields.some((f) => f.type === 'image');
  const maxWidthClass = size === 'lg' || hasImage ? 'sm:max-w-[650px]' : 'sm:max-w-[500px]';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className={`${maxWidthClass} bg-card border-border p-0 overflow-hidden`}>
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              {icon}
            </div>
            {title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmitForm} className="p-6">
          <div className={`flex flex-col ${hasImage ? 'md:flex-row gap-8' : 'gap-5'}`}>
            {/* Image Columns if any */}
            {hasImage && (
              <div className="flex flex-col items-center gap-4">
                {fields
                  .filter((f) => f.type === 'image')
                  .map((field) => (
                    <div key={field.key} className="flex flex-col items-center gap-4">
                      <div className="relative group">
                        <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-slate-50 dark:border-white/5 shadow-xl relative ring-1 ring-slate-200 dark:ring-white/10 transition-all group-hover:ring-blue-500">
                          <Image
                            src={previews[field.key] || DEFAULT_AVATAR}
                            alt={`${field.label} preview`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                          <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Upload className="w-8 h-8 text-white mb-1" />
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Thay đổi ảnh</span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(field.key, e)}
                            />
                          </label>
                        </div>
                        {files[field.key] && (
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="absolute -top-1 -right-1 w-7 h-7 rounded-full shadow-lg"
                            onClick={() => handleClearImage(field.key)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          {field.label}
                        </p>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          5MB (JPG, PNG)
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Input Columns */}
            <div className="flex-1 space-y-4">
              {fields
                .filter((f) => f.type !== 'image')
                .map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key} className="text-sm font-semibold flex items-center gap-1">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    {field.type === 'textarea' ? (
                      <div>
                        <Textarea
                          id={field.key}
                          value={formData[field.key] || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          placeholder={field.placeholder}
                          className="min-h-[120px] bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 resize-none py-3"
                          maxLength={field.maxLength}
                          disabled={isLoading}
                          required={field.required}
                        />
                        {field.maxLength && (
                          <div className="flex justify-end mt-1">
                            <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">
                              {(formData[field.key] || '').length}/{field.maxLength}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <Input
                          id={field.key}
                          value={formData[field.key] || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          placeholder={field.placeholder}
                          className="h-11 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20"
                          maxLength={field.maxLength}
                          disabled={isLoading}
                          required={field.required}
                        />
                        {field.maxLength && (
                          <div className="flex justify-end mt-1">
                            <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">
                              {(formData[field.key] || '').length}/{field.maxLength}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          <DialogFooter className="pt-6 mt-6 border-t border-border gap-3 font-medium">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="font-semibold text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 h-11 px-6 transition-all"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-8 shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
