import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsQueries } from '@/features/admin/api/analyticsApi';

export function useActiveUsers() {
    const { data, isLoading, refetch } = useQuery({
        ...analyticsQueries.activeUsers(),
    });
    const [count, setCount] = useState(0);
    const previousCountRef = useRef(0);

    useEffect(() => {
        if (data?.count === undefined) return;

        const start = previousCountRef.current;
        const end = data.count;
        const duration = 1000;
        const stepTime = 50;
        const steps = duration / stepTime;
        const increment = (end - start) / steps;

        let current = start;
        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                previousCountRef.current = end;
                setCount(end);
                clearInterval(timer);
                return;
            }
            setCount(Math.round(current));
        }, stepTime);

        return () => clearInterval(timer);
    }, [data?.count]);

    useEffect(() => {
        const interval = setInterval(() => {
            refetch();
        }, 15000);
        return () => clearInterval(interval);
    }, [refetch]);

    return { count, isLoading };
}

export function useAnalyticsData() {
    const heatmap = useQuery({
        ...analyticsQueries.readingHeatmap(),
    });
    const engagement = useQuery({
        ...analyticsQueries.chapterEngagement(5),
    });
    const geographic = useQuery({
        ...analyticsQueries.geographic(),
    });

    return {
        heatmap: {
            data: Array.isArray(heatmap.data) ? heatmap.data : [],
            isLoading: heatmap.isLoading,
            error: heatmap.error
        },
        engagement: {
            data: Array.isArray(engagement.data) ? engagement.data : [],
            isLoading: engagement.isLoading,
            error: engagement.error
        },
        geographic: {
            data: Array.isArray(geographic.data) ? geographic.data : [],
            isLoading: geographic.isLoading,
            error: geographic.error
        }
    };
}
