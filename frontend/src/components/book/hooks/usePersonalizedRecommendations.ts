import { useState } from 'react';
import { useGetPersonalizedRecommendationsQuery } from '@/features/recommendations/api/recommendationsApi';
import { useAppAuth } from '@/features/auth/hooks';

interface RecommendedBook {
    bookId: string;
    book: {
        slug: string;
        title: string;
        coverUrl?: string;
        authorId?: { name?: string };
    };
    matchScore?: number;
    reason?: string;
}

export function usePersonalizedRecommendations(limit: number = 12) {
    const { isAuthenticated } = useAppAuth();

    const { data, isLoading, error } = useGetPersonalizedRecommendationsQuery(
        { page: 1, limit },
        { skip: !isAuthenticated }
    );

    return {
        recommendations: data?.recommendations || [],
        isLoading,
        error,
        isEmpty: !data?.recommendations || data.recommendations.length === 0,
    };
}
