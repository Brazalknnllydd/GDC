import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Search, UserCircle2 } from 'lucide-react-native';

import { AdminModalShell } from '../ui/admin-modal-shell';
import { spacing, radius } from '../../constants/design-system';
import { colors, fonts, textSizes } from '../../constants/theme';
import { useResponsiveLayout } from '../../hooks/use-responsive-layout';
import { apiClient } from '../../lib/api';
import { triggerHaptic } from '../../lib/haptics';

type Customer = {
  id: number;
  name: string;
};

type CashierCustomerModalProps = {
  onClose: () => void;
  onSelect: (id: number | null, name: string | null) => void;
  selectedCustomerId: number | null;
  visible: boolean;
};

export function CashierCustomerModal({ onClose, onSelect, selectedCustomerId, visible }: CashierCustomerModalProps) {
  const { compactPhone } = useResponsiveLayout();
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCustomers();
    }
  }, [visible, search]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/customers', {
        params: { search, limit: 100, page: 1 },
      });
      setCustomers(data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (customer: Customer | null) => {
    triggerHaptic('medium');
    onSelect(customer?.id ?? null, customer?.name ?? null);
    onClose();
  };

  if (!visible) return null;

  return (
    <AdminModalShell
      compact={compactPhone}
      onClose={onClose}
      title="Attach Customer"
      visible={true}
    >
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Search color={colors.textTertiary} size={20} />
          <TextInput
            onChangeText={setSearch}
            placeholder="Search customers..."
            style={styles.searchInput}
            value={search}
            autoFocus
          />
        </View>

        <ScrollView 
          style={styles.list} 
          contentContainerStyle={{ gap: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable 
            style={[styles.customerResultCard, selectedCustomerId === null && styles.customerResultCardSelected]}
            onPress={() => handleSelect(null)}
          >
            <UserCircle2 color={selectedCustomerId === null ? colors.primary : colors.textTertiary} size={20} />
            <View>
              <Text style={[styles.customerResultName, selectedCustomerId === null && styles.customerResultNameSelected]}>
                Walk-in (No Customer)
              </Text>
            </View>
          </Pressable>

          {loading ? (
            <ActivityIndicator style={{ padding: spacing.xl }} color={colors.primary} />
          ) : (
            customers.map((c) => (
              <Pressable
                key={c.id}
                style={[styles.customerResultCard, selectedCustomerId === c.id && styles.customerResultCardSelected]}
                onPress={() => handleSelect(c)}
              >
                <UserCircle2 color={selectedCustomerId === c.id ? colors.primary : colors.textTertiary} size={20} />
                <View>
                  <Text style={[styles.customerResultName, selectedCustomerId === c.id && styles.customerResultNameSelected]}>
                    {c.name}
                  </Text>
                  {c.phone ? <Text style={styles.customerResultMeta}>{c.phone}</Text> : null}
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </AdminModalShell>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.borderPanel,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    color: colors.textStrong,
  },
  list: {
    maxHeight: 350,
  },
  customerResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderPanel,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  customerResultCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  customerResultName: {
    fontFamily: fonts.medium,
    fontSize: textSizes.body,
    color: colors.textStrong,
  },
  customerResultNameSelected: {
    color: colors.primary,
    fontFamily: fonts.bold,
  },
  customerResultPhone: {
    fontFamily: fonts.regular,
    fontSize: textSizes.xsmall,
    color: colors.textTertiary,
  },
});
