import { StyleSheet, View } from 'react-native';

import { tabs as productTabs } from '../components/admin-products/products-screen-data';
import { CashierCustomersSection } from '../components/cashier/cashier-customers-section';
import { AdminPageScreen } from '../components/ui/admin-page-screen';

export default function AdminCustomersScreen() {
  const customerTabs = productTabs.map((tab) =>
    tab.label === 'Customers'
      ? { ...tab, active: true, route: '/admin-customers' as const }
      : { ...tab, active: false }
  );

  return (
    <AdminPageScreen
      bottomNavItems={customerTabs}
      introDescription="Manage your customers, track their details, and view their purchase history."
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
