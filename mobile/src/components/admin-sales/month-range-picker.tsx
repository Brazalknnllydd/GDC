import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import DateTimePicker, {
  useDefaultStyles,
  type DateType,
} from 'react-native-ui-datepicker';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts } from '../../constants/theme';

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

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1);
}

function normalizeMonth(date: Date | null) {
  if (!date) {
    return null;
  }

  return startOfMonth(date.getFullYear(), date.getMonth());
}

function toDate(value: DateType) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const parsedValue = (value as { toDate?: () => Date }).toDate?.();
    return parsedValue instanceof Date && !Number.isNaN(parsedValue.getTime()) ? parsedValue : null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function MonthRangePicker({
  displayYear,
  onChangeRange,
  onChangeYear,
  range,
}: MonthRangePickerProps) {
  const defaultStyles = useDefaultStyles() as Record<string, any>;
  const calendarStyles = useMemo(
    () => ({
      ...defaultStyles,
      header: {
        ...(defaultStyles.header || {}),
        marginBottom: spacing.sm,
      },
      months: {
        ...(defaultStyles.months || {}),
        gap: spacing.sm,
      },
      month: {
        ...(defaultStyles.month || {}),
        backgroundColor: colors.card,
        borderColor: colors.borderMuted,
        borderRadius: radius.md,
        borderWidth: 1,
        minHeight: 42,
      },
      month_label: {
        ...(defaultStyles.month_label || {}),
        color: colors.textHeading,
        fontFamily: fonts.medium,
        fontSize: 12,
      },
      year_selector_label: {
        ...(defaultStyles.year_selector_label || {}),
        color: colors.secondary,
        fontFamily: fonts.bold,
        fontSize: 15,
      },
      button_prev: {
        ...(defaultStyles.button_prev || {}),
        alignItems: 'center',
        backgroundColor: colors.card,
        borderColor: colors.borderMuted,
        borderRadius: radius.round,
        borderWidth: 1,
        height: 32,
        justifyContent: 'center',
        width: 32,
      },
      button_next: {
        ...(defaultStyles.button_next || {}),
        alignItems: 'center',
        backgroundColor: colors.card,
        borderColor: colors.borderMuted,
        borderRadius: radius.round,
        borderWidth: 1,
        height: 32,
        justifyContent: 'center',
        width: 32,
      },
      range_start: {
        ...(defaultStyles.range_start || {}),
        backgroundColor: colors.secondary,
        borderColor: colors.secondary,
      },
      range_end: {
        ...(defaultStyles.range_end || {}),
        backgroundColor: colors.secondary,
        borderColor: colors.secondary,
      },
      range_middle: {
        ...(defaultStyles.range_middle || {}),
        backgroundColor: colors.surfaceBrandSoft,
        borderColor: colors.borderInfoStrong,
      },
      range_start_label: {
        ...(defaultStyles.range_start_label || {}),
        color: colors.textInverse,
        fontFamily: fonts.medium,
      },
      range_end_label: {
        ...(defaultStyles.range_end_label || {}),
        color: colors.textInverse,
        fontFamily: fonts.medium,
      },
      range_middle_label: {
        ...(defaultStyles.range_middle_label || {}),
        color: colors.secondary,
        fontFamily: fonts.medium,
      },
      selected_month: {
        ...(defaultStyles.selected_month || {}),
        backgroundColor: colors.secondary,
        borderColor: colors.secondary,
      },
      selected_month_label: {
        ...(defaultStyles.selected_month_label || {}),
        color: colors.textInverse,
        fontFamily: fonts.medium,
      },
    }),
    [defaultStyles]
  );

  return (
    <View style={styles.card}>
      <DateTimePicker
        components={{
          IconNext: <ChevronRight color={colors.secondary} size={16} strokeWidth={2.2} />,
          IconPrev: <ChevronLeft color={colors.secondary} size={16} strokeWidth={2.2} />,
        }}
        disableMonthPicker
        endDate={range.endMonth}
        hideWeekdays
        initialView="month"
        locale="en-PH"
        mode="range"
        month={0}
        monthCaptionFormat="short"
        navigationPosition="around"
        onChange={({ endDate, startDate }) => {
          const normalizedStart = normalizeMonth(toDate(startDate));
          const normalizedEnd = normalizeMonth(toDate(endDate));

          onChangeRange({
            endMonth: normalizedEnd || normalizedStart,
            startMonth: normalizedStart,
          });
        }}
        onYearChange={onChangeYear}
        showOutsideDays={false}
        startDate={range.startMonth}
        style={styles.picker}
        styles={calendarStyles}
        year={displayYear}
      />
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
  picker: {
    backgroundColor: 'transparent',
  },
});
