import { useCallback, useState } from 'react';

export function useRefreshHandler(refresh: () => Promise<unknown> | unknown) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);

    Promise.resolve(refresh()).finally(() => {
      setIsRefreshing(false);
    });
  }, [refresh]);

  return {
    isRefreshing,
    onRefresh,
  };
}
