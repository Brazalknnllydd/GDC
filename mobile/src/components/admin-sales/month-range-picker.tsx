import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts, textRoles, textSizes } from '../../constants/theme';

export type MonthRangeValue = {
  endMonth: Date | null;
  startMonth: Date | null;
};

type MonthRangePickerProps = {
  displayYear: number;
  onChangeRange: (nextRange: MonthRangeValue) => void;
  onChangeYear: (nextYear: number) => void;
  range: MonthRangeValue;
};

const months = Array.from({ length: 12 }, (_, month) => ({
  label: new Date(2024, month, 1).toLocaleDateString('en-PH', { month: 'short' }),
  value: month,
}));

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1);
}

function getMonthTime(value: Date | null) {
  return value ? startOfMonth(value.getFullYear(), value.getMonth()).getTime() : null;
}

function getOrderedRange(left: Date, right: Date): MonthRangeValue {
  return left.getTime() <= right.getTime()
    ? { startMonth: left, endMonth: right }
    : { startMonth: right, endMonth: left };
}

export function MonthRangePicker({
  displayYear,
  onChangeRange,
  onChangeYear,
  range,
}: MonthRangePickerProps) {
  const [pendingStart, setPendingStart] = useState<Date | null>(null);
  const startTime = getMonthTime(range.startMonth);
  const endTime = getMonthTime(range.endMonth);

  const selectedRange = useMemo(() => {
    const start = startTime ?? endTime;
    const end = endTime ?? startTime;

    return {
      end,
      start,
    };
  }, [endTime, startTime]);

  function handleSelectMonth(month: number) {
    const selectedMonth = startOfMonth(displayYear, month);

    if (!pendingStart) {
      setPendingStart(selectedMonth);
      onChangeRange({
        endMonth: selectedMonth,
        startMonth: selectedMonth,
      });
      return;
    }

    onChangeRange(getOrderedRange(pendingStart, selectedMonth));
    setPendingStart(null);
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Previous year"
          onPress={() => onChangeYear(displayYear - 1)}
          style={styles.navButton}>
          <ChevronLeft color={colors.secondary} size={17} strokeWidth={2.2} />
        </Pressable>

        <Text style={styles.yearLabel}>{displayYear}</Text>

        <Pressable
          accessibilityLabel="Next year"
          onPress={() => onChangeYear(displayYear + 1)}
          style={styles.navButton}>
          <ChevronRight color={colors.secondary} size={17} strokeWidth={2.2} />
        </Pressable>
      </View>

      <View style={styles.monthGrid}>
        {months.map((month) => {
          const date = startOfMonth(displayYear, month.value);
          const monthTime = date.getTime();
          const isRangeStart = startTime === monthTime;
          const isRangeEnd = endTime === monthTime;
          const isInRange =
            selectedRange.start !== null &&
            selectedRange.end !== null &&
            monthTime > selectedRange.start &&
            monthTime < selectedRange.end;
          const isSelected = isRangeStart || isRangeEnd;

          return (
            <Pressable
              key={month.value}
              onPress={() => handleSelectMonth(month.value)}
              style={[
                styles.monthCell,
                isInRange && styles.monthCellInRange,
                isSelected && styles.monthCellSelected,
              ]}>
              <Text
                style={[
                  styles.monthText,
                  isInRange && styles.monthTextInRange,
                  isSelected && styles.monthTextSelected,
                ]}>
                {month.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.helperText}>
        Tap a start month, then tap an end month to filter this page.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.borderPanel,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.borderMuted,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  yearLabel: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: textSizes.bodyLarge,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  monthCell: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.borderMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    flexBasis: '30.8%',
    flexGrow: 1,
    minHeight: 48,
    justifyContent: 'center',
  },
  monthCellInRange: {
    backgroundColor: colors.surfaceBrandSoft,
    borderColor: colors.borderInfoStrong,
  },
  monthCellSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  monthText: {
    color: colors.textHeading,
    fontFamily: fonts.medium,
    fontSize: textSizes.small + 1,
  },
  monthTextInRange: {
    color: colors.secondary,
  },
  monthTextSelected: {
    color: colors.textInverse,
  },
  helperText: {
    color: colors.textTertiary,
    ...textRoles.body,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
