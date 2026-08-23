import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Category } from '../components/admin-products/products-screen-data';
import { apiClient } from '../lib/api';
import { getApiErrorMessage } from '../lib/api-errors';

export type StaffCashier = {
  allowedCategories: Array<{
    id: number;
    name: string;
  }>;
  createdAt: string;
  id: number;
  name: string;
  role: string;
  username: string;
};

export function useAdminSettingsData() {
  const [cashiers, setCashiers] = useState<StaffCashier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [screenError, setScreenError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  const loadSettingsData = useCallback(async () => {
    try {
      if (!isMountedRef.current) return;
      setScreenError('');
      setIsLoading(true);

      const [cashiersResponse, categoriesResponse] = await Promise.all([
        apiClient.get<StaffCashier[]>('/staff/cashiers'),
        apiClient.get<Category[]>('/categories'),
      ]);

      if (!isMountedRef.current) return;

      setCashiers(cashiersResponse.data);
      setCategories(
        categoriesResponse.data.sort((left, right) => left.name.localeCompare(right.name))
      );
    } catch (error) {
      if (!isMountedRef.current) return;
      setScreenError(getApiErrorMessage(error, 'Could not load admin settings right now.'));
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadSettingsData();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadSettingsData]);

  const assignedCategoryCount = useMemo(
    () => cashiers.reduce((sum, cashier) => sum + cashier.allowedCategories.length, 0),
    [cashiers]
  );

  function prependCashier(cashier: StaffCashier) {
    setCashiers((current) => [cashier, ...current]);
  }

  return {
    assignedCategoryCount,
    cashiers,
    categories,
    isLoading,
    prependCashier,
    reloadSettingsData: loadSettingsData,
    screenError,
  };
}
