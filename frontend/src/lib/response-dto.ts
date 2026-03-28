import type { ResponseDto } from '@/types/response';

export function extractResponseDtoData<T>(
  response: ResponseDto<T> | null | undefined
): T | null {
  return response?.data ?? null;
}
