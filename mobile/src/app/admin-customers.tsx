import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { tabs as productTabs } from '../components/admin-products/products-screen-data';
import { CashierCustomersSection } from '../components/cashier/cashier-customers-section';
import { AdminPageScreen } from '../components/ui/admin-page-screen';
import { useRefreshHandler } from '../hooks/use-refresh-handler';

export default function AdminCustomersScreen() {
  const queryClient = useQueryClient();
  const customerTabs = productTabs.map((tab) =>
    tab.label === 'Customers'
      ? { ...tab, active: true, route: '/admin-customers' as const }
      : { ...tab, active: false }
  );
  const refreshCustomers = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
    [queryClient],
  );
  const { isRefreshing, onRefresh } = useRefreshHandler(refreshCustomers);

  return (
    <AdminPageScreen
      bottomNavItems={customerTabs}
      introDescription="Manage your customers, track their details, and view their purchase history."
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      title="Customers">
      <View style={styles.container}>
        <CashierCustomersSection />
      </View>
    </AdminPageScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 16,
  },
});
