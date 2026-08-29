import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { Category } from '../components/admin-products/products-screen-data';
import { apiClient } from '../lib/api';

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
  const queryClient = useQueryClient();

  const cashiersQuery = useQuery({
    queryKey: ['staff', 'cashiers'],
    queryFn: async () => {
      const response = await apiClient.get<StaffCashier[]>('/staff/cashiers');
      return response.data;
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.get<Category[]>('/categories');
      return response.data.sort((left, right) => left.name.localeCompare(right.name));
    },
  });

  const assignedCategoryCount = useMemo(
    () =>
      (cashiersQuery.data ?? []).reduce(
        (sum, cashier) => sum + cashier.allowedCategories.length,
        0
      ),
    [cashiersQuery.data]
  );

  function prependCashier(cashier: StaffCashier) {
    queryClient.setQueryData<StaffCashier[]>(['staff', 'cashiers'], (current) => [
      cashier,
      ...(current ?? []),
    ]);
  }

  return {
    assignedCategoryCount,
    cashiers: cashiersQuery.data ?? [],
    categories: categoriesQuery.data ?? [],
    isLoading: cashiersQuery.isLoading || categoriesQuery.isLoading,
    prependCashier,
    reloadSettingsData: async () => {
      await Promise.all([cashiersQuery.refetch(), categoriesQuery.refetch()]);
    },
    screenError:
      cashiersQuery.error?.message ||
      categoriesQuery.error?.message ||
      '',
  };
}
