import { queryClient } from '@/lib/query-client';
import { recommendationsKeys } from '@/lib/query-keys';

export * from './recommendations.api';
export * from './recommendations.queries';

export const recommendationsApi = {
  util: {
    resetApiState: () => {
      queryClient.invalidateQueries({ queryKey: recommendationsKeys.all });
    },
  },
};