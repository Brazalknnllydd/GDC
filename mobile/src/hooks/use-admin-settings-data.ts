import { useCallback, useEffect, useMemo, useState } from 'react';

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

  const loadSettingsData = useCallback(async () => {
    try {
      setScreenError('');
      setIsLoading(true);

      const [cashiersResponse, categoriesResponse] = await Promise.all([
        apiClient.get<StaffCashier[]>('/staff/cashiers'),
        apiClient.get<Category[]>('/categories'),
      ]);

      setCashiers(cashiersResponse.data);
      setCategories(
        categoriesResponse.data.sort((left, right) => left.name.localeCompare(right.name))
      );
    } catch (error) {
      setScreenError(getApiErrorMessage(error, 'Could not load admin settings right now.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettingsData();
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
