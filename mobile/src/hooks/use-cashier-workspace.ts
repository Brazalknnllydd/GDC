import { useCallback, useEffect, useState } from 'react';

import type { CashierDashboardResponse } from '../components/cashier/cashier-screen-data';
import type { Category, Product } from '../components/admin-products/products-screen-data';
import { apiClient } from '../lib/api';
import { getApiErrorMessage } from '../lib/api-errors';

const emptyDashboard: CashierDashboardResponse = {
  cashier: {
    allowedCategories: [],
    id: 0,
    name: 'Cashier',
    role: 'Cashier',
    username: 'cashier',
  },
  currentShift: null,
  paymentBreakdown: [],
  performance: {
    itemsSold: 0,
    salesToday: 0,
    served: 0,
    transactions: 0,
  },
  recentSales: [],
  totals: {
    drawerVariance: 0,
    totalReportedSales: 0,
    cashReceived: 0,
    changeGiven: 0,
  },
};

export function useCashierWorkspace() {
  const [dashboard, setDashboard] = useState<CashierDashboardResponse>(emptyDashboard);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [screenError, setScreenError] = useState('');

  const loadWorkspace = useCallback(async () => {
    try {
      setScreenError('');

      const [dashboardResponse, productsResponse, categoriesResponse] =
        await Promise.all([
          apiClient.get<CashierDashboardResponse>('/cashier/dashboard/me'),
          apiClient.get<Product[]>('/products'),
          apiClient.get<Category[]>('/categories'),
        ]);

      setDashboard(dashboardResponse.data);
      const hasRestrictedCategories = dashboardResponse.data.cashier.allowedCategories.length > 0;
      const allowedIds = new Set(
        dashboardResponse.data.cashier.allowedCategories.map((category) => category.id)
      );
      const visibleCategories = hasRestrictedCategories
        ? categoriesResponse.data.filter((category) => allowedIds.has(category.id))
        : categoriesResponse.data;
      const visibleProducts = hasRestrictedCategories
        ? productsResponse.data.filter((product) => allowedIds.has(product.categoryId))
        : productsResponse.data;

      setProducts(visibleProducts);
      setCategories(visibleCategories);
    } catch (error) {
      setScreenError(getApiErrorMessage(error, 'Could not load cashier workspace right now.'));
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  return {
    categories,
    dashboard,
    products,
    reloadWorkspace: loadWorkspace,
    screenError,
    setScreenError,
  };
}
