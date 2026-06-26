import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, textRoles } from '../../constants/theme';

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

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1);
}

function isSameMonth(left: Date | null, right: Date | null) {
  if (!left || !right) {
    return false;
  }

  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function isMonthBetween(target: Date, start: Date | null, end: Date | null) {
  if (!start || !end) {
    return false;
  }

  const targetValue = target.getFullYear() * 12 + target.getMonth();
  const startValue = start.getFullYear() * 12 + start.getMonth();
  const endValue = end.getFullYear() * 12 + end.getMonth();

  return targetValue > startValue && targetValue < endValue;
}

export function MonthRangePicker({
  displayYear,
  onChangeRange,
  onChangeYear,
  range,
}: MonthRangePickerProps) {
  function handleSelectMonth(monthIndex: number) {
    const selectedMonth = startOfMonth(displayYear, monthIndex);

    if (!range.startMonth) {
      onChangeRange({
        endMonth: selectedMonth,
        startMonth: selectedMonth,
      });
      return;
    }

    if (range.startMonth && range.endMonth && isSameMonth(range.startMonth, range.endMonth)) {
      if (isSameMonth(selectedMonth, range.startMonth)) {
        onChangeRange({
          endMonth: selectedMonth,
          startMonth: selectedMonth,
        });
        return;
      }

      if (selectedMonth.getTime() < range.startMonth.getTime()) {
        onChangeRange({
          endMonth: range.startMonth,
          startMonth: selectedMonth,
        });
        return;
      }

      onChangeRange({
        endMonth: selectedMonth,
        startMonth: range.startMonth,
      });
      return;
    }

    onChangeRange({
      endMonth: selectedMonth,
      startMonth: selectedMonth,
    });
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable onPress={() => onChangeYear(displayYear - 1)} style={styles.yearButton}>
          <ChevronLeft color={colors.secondary} size={16} strokeWidth={2.2} />
        </Pressable>

        <Text style={styles.yearText}>{displayYear}</Text>

        <Pressable onPress={() => onChangeYear(displayYear + 1)} style={styles.yearButton}>
          <ChevronRight color={colors.secondary} size={16} strokeWidth={2.2} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {monthLabels.map((label, index) => {
          const monthDate = startOfMonth(displayYear, index);
          const isStart = isSameMonth(monthDate, range.startMonth);
          const isEnd = isSameMonth(monthDate, range.endMonth);
          const isBetween = isMonthBetween(monthDate, range.startMonth, range.endMonth);

          return (
            <Pressable
              key={`${displayYear}-${label}`}
              onPress={() => handleSelectMonth(index)}
              style={[
                styles.monthChip,
                (isStart || isEnd) && styles.monthChipEdge,
                isBetween && styles.monthChipBetween,
              ]}>
              <Text
                style={[
                  styles.monthChipText,
                  (isStart || isEnd) && styles.monthChipTextEdge,
                  isBetween && styles.monthChipTextBetween,
                ]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F8FAFF',
    borderColor: '#DCE4F2',
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  monthChip: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D4D9E7',
    borderRadius: radius.md,
    borderWidth: 1,
    minWidth: '22%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 1,
  },
  monthChipBetween: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C9D3FF',
  },
  monthChipEdge: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  monthChipText: {
    color: '#40485A',
    ...textRoles.label,
  },
  monthChipTextBetween: {
    color: colors.secondary,
  },
  monthChipTextEdge: {
    color: '#FFFFFF',
  },
  yearButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D4D9E7',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  yearText: {
    color: colors.secondary,
    ...textRoles.value,
  },
});
