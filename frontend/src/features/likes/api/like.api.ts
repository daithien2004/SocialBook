import { apiRequest } from '@/lib/api-client';
import {
  type LikeCountResponse,
  type LikeRequest,
  type LikeStatusResponse,
  type ToggleLikeResult,
} from '@/features/likes/schemas/like.schema';

export async function toggleLike(req: LikeRequest): Promise<ToggleLikeResult> {
  return apiRequest<ToggleLikeResult>({
    url: '/likes/toggle',
    method: 'POST',
    data: { targetId: req.targetId, targetType: req.targetType },
  });
}

export async function getLikeCount(req: LikeRequest): Promise<LikeCountResponse> {
  return apiRequest<LikeCountResponse>({
    url: '/likes/count',
    method: 'GET',
    params: { targetId: req.targetId, targetType: req.targetType },
  });
}

export async function getLikeStatus(req: LikeRequest): Promise<LikeStatusResponse> {
  return apiRequest<LikeStatusResponse>({
    url: '/likes/status',
    method: 'GET',
    params: { targetId: req.targetId, targetType: req.targetType },
  });
}