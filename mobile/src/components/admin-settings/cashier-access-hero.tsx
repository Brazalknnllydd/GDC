import { StyleSheet, Text, View } from 'react-native';
import { Plus, ShieldCheck } from 'lucide-react-native';

import { AppButton } from '../ui/app-button';
import { SurfaceCard } from '../ui/surface-card';
import { radius, spacing } from '../../constants/design-system';
import { colors, textRoles, textSizes } from '../../constants/theme';
import { useResponsiveLayout } from '../../hooks/use-responsive-layout';

type CashierAccessHeroProps = {
  assignedCategoryCount: number;
  cashierCount: number;
  categoriesAvailable: boolean;
  onAddCashier: () => void;
};

export function CashierAccessHero({
  assignedCategoryCount,
  cashierCount,
  categoriesAvailable,
  onAddCashier,
}: CashierAccessHeroProps) {
  const { compactPhone } = useResponsiveLayout();

  return (
    <SurfaceCard style={[styles.card, compactPhone && styles.cardCompact]}>
      <View style={[styles.header, compactPhone && styles.headerCompact]}>
        <View style={styles.iconWrap}>
          <ShieldCheck color={colors.secondary} size={24} strokeWidth={2} />
        </View>

        <AppButton
          disabled={!categoriesAvailable}
          fullWidth={compactPhone}
          icon={({ color, size }) => <Plus color={color} size={size} strokeWidth={2.2} />}
          label="Add Cashier"
          onPress={onAddCashier}
          size="sm"
          variant="primary"
        />
      </View>

      <Text style={styles.title}>Cashier Category Access</Text>
      <Text style={styles.body}>
        Create cashier accounts and limit them to the product categories you assign. Products from
        those categories automatically become the only items they can sell.
      </Text>

      <View style={[styles.summaryRow, compactPhone && styles.summaryRowCompact]}>
        <View style={styles.summaryPill}>
          <Text style={styles.summaryLabel}>Cashiers</Text>
          <Text style={styles.summaryValue}>{cashierCount}</Text>
        </View>
        <View style={styles.summaryPill}>
          <Text style={styles.summaryLabel}>Assigned Categories</Text>
          <Text style={styles.summaryValue}>{assignedCategoryCount}</Text>
        </View>
      </View>

      {!categoriesAvailable ? (
        <Text style={styles.helperText}>
          Add product categories first before creating cashier access rules.
        </Text>
      ) : null}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  cardCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerCompact: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceBrandSoft,
    borderRadius: radius.md,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  title: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: textSizes.large,
    marginBottom: spacing.sm,
  },
  body: {
    color: colors.textSecondary,
    ...textRoles.body,
    fontSize: 15,
    lineHeight: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  summaryRowCompact: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  summaryPill: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  summaryLabel: {
    color: colors.muted,
    ...textRoles.label,
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    color: colors.textStrong,
    ...textRoles.value,
    fontSize: 20,
  },
  helperText: {
    color: colors.dangerStrong,
    ...textRoles.label,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.md,
  },
});
