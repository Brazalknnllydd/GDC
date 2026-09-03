import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Receipt } from 'lucide-react-native';

import type { CashierDashboardResponse } from './cashier-screen-data';
import { AppButton } from '../ui/app-button';
import { ProductFormInput } from '../ui/product-form-input';
import { SectionHeading } from '../ui/section-heading';
import { SurfaceCard } from '../ui/surface-card';
import { spacing } from '../../constants/design-system';
import { colors, fonts, textRoles, textSizes } from '../../constants/theme';
import { apiClient } from '../../lib/api';
import { getApiErrorMessage } from '../../lib/api-errors';
import { formatPeso } from '../../lib/product-utils';
import { useResponsiveLayout } from '../../hooks/use-responsive-layout';

const expenseColumns = {
  amount: 112,
  date: 142,
  description: 240,
};
const expenseTableWidth = Object.values(expenseColumns).reduce((sum, width) => sum + width, 0);

type CashierExpensesSectionProps = {
  dashboard: CashierDashboardResponse;
  onSaved: () => Promise<void>;
  onToast: (message: string, type: 'success' | 'error') => void;
};

function formatExpenseDate(value: string) {
  return new Date(value).toLocaleString('en-PH', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  });
}

export function CashierExpensesSection({
  dashboard,
  onSaved,
  onToast,
}: CashierExpensesSectionProps) {
  const { compactPhone, isTablet } = useResponsiveLayout();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const expenses = dashboard.recentExpenses ?? [];
  const expenseTotal = dashboard.totals.expenses ?? 0;

  async function handleSaveExpense() {
    const parsedAmount = Number(amount.replace(/,/g, ''));

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      onToast('Enter a valid expense amount.', 'error');
      return;
    }

    if (!description.trim()) {
      onToast('Enter what the expense was for.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.post('/cashier/expenses', {
        amount: parsedAmount,
        description: description.trim(),
        shiftId: dashboard.currentShift?.id ?? undefined,
      });
      setAmount('');
      setDescription('');
      await onSaved();
      onToast('Expense recorded successfully.', 'success');
    } catch (error) {
      onToast(getApiErrorMessage(error, 'Failed to record expense.'), 'error');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View>
      <SectionHeading style={styles.sectionLabel}>CASHIER EXPENSES</SectionHeading>

      <SurfaceCard style={[styles.formCard, isTablet && styles.formCardTablet]}>
        <View style={styles.formText}>
          <Text style={styles.formTitle}>Record expense</Text>
          <Text style={styles.formSubtitle}>
            Expenses reduce the expected cash for the current shift.
          </Text>
        </View>
        <View style={styles.formFields}>
          <ProductFormInput
            dense
            keyboardType="decimal-pad"
            label="AMOUNT"
            onChangeText={setAmount}
            placeholder="0.00"
            value={amount}
          />
          <ProductFormInput
            dense
            label="DESCRIPTION"
            onChangeText={setDescription}
            placeholder="e.g. delivery fee, supplies"
            value={description}
          />
          <AppButton
            disabled={!dashboard.currentShift}
            icon={Receipt}
            label="Save Expense"
            loading={isSaving}
            onPress={handleSaveExpense}
            variant="primary"
          />
        </View>
      </SurfaceCard>

      <View style={[styles.summaryRow, compactPhone && styles.summaryRowCompact]}>
        <SurfaceCard style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>EXPENSES THIS SHIFT</Text>
          <Text style={styles.summaryValue}>{formatPeso(expenseTotal)}</Text>
        </SurfaceCard>
        <SurfaceCard style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>EXPECTED CASH</Text>
          <Text style={styles.summaryValue}>
            {formatPeso(dashboard.currentShift?.expectedCashOnHand ?? 0)}
          </Text>
        </SurfaceCard>
      </View>

      <SectionHeading style={styles.sectionHeaderLabel}>RECENT EXPENSES</SectionHeading>
      <SurfaceCard style={styles.tableCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.tableScroller}>
          <View style={[styles.tableContent, { minWidth: expenseTableWidth }]}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { width: expenseColumns.date }]}>DATE</Text>
              <Text style={[styles.headerCell, { width: expenseColumns.description }]}>DESCRIPTION</Text>
              <Text style={[styles.headerCell, styles.amountCell, { width: expenseColumns.amount }]}>AMOUNT</Text>
            </View>

            {expenses.length > 0 ? (
              expenses.map((expense) => (
                <View key={expense.id} style={styles.tableRow}>
                  <Text style={[styles.bodyCell, { width: expenseColumns.date }]}>{formatExpenseDate(expense.expenseDate)}</Text>
                  <Text style={[styles.bodyCell, { width: expenseColumns.description }]} numberOfLines={2}>
                    {expense.description}
                  </Text>
                  <Text style={[styles.bodyCell, styles.amountCell, styles.expenseAmount, { width: expenseColumns.amount }]}>
                    {formatPeso(expense.amount)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No expenses recorded for this shift.</Text>
            )}
          </View>
        </ScrollView>
      </SurfaceCard>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    marginBottom: spacing.lg,
  },
  formCard: {
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  formCardTablet: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xl,
  },
  formText: {
    flex: 1,
  },
  formTitle: {
    color: colors.textStrong,
    fontFamily: fonts.bold,
    fontSize: textSizes.title,
  },
  formSubtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  formFields: {
    flex: 1.4,
    width: '100%',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryRowCompact: {
    flexDirection: 'column',
  },
  summaryCard: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  summaryLabel: {
    color: colors.textTertiary,
    ...textRoles.label,
    fontSize: textSizes.smallCaps,
  },
  summaryValue: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: textSizes.title,
    marginTop: spacing.xs,
  },
  sectionHeaderLabel: {
    marginBottom: spacing.lg,
  },
  tableCard: {
    marginBottom: spacing.section,
    overflow: 'hidden',
    paddingVertical: 0,
  },
  tableScroller: {
    flexGrow: 1,
  },
  tableContent: {
    width: '100%',
  },
  tableHeader: {
    backgroundColor: colors.surfaceNeutral,
    borderBottomColor: colors.borderPanel,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  tableRow: {
    alignItems: 'center',
    borderBottomColor: colors.borderPanel,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerCell: {
    color: colors.textSecondary,
    ...textRoles.label,
    fontSize: textSizes.smallCaps,
    paddingRight: spacing.md,
  },
  bodyCell: {
    color: colors.textSoft,
    fontFamily: fonts.regular,
    fontSize: textSizes.small + 1,
    lineHeight: 18,
    paddingRight: spacing.md,
  },
  amountCell: {
    textAlign: 'right',
  },
  expenseAmount: {
    color: colors.dangerStrong,
    fontFamily: fonts.semiBold,
  },
  emptyText: {
    color: colors.textTertiary,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
    textAlign: 'center',
  },
});
