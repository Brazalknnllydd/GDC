import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts, textRoles, textSizes } from '../../constants/theme';
import { formatCompactTick } from './admin-chart-utils';
import { useResponsiveLayout } from '../../hooks/use-responsive-layout';
import { formatPeso } from '../../lib/product-utils';

type AdminBarChartProps = {
  height?: number;
  labels: string[];
  values: number[];
  emptyDescription?: string;
  emptyTitle?: string;
};

export function AdminBarChart({
  height = 240,
  labels,
  values,
  emptyDescription = 'No revenue is available for the selected range.',
  emptyTitle = 'No chart data',
}: AdminBarChartProps) {
  const { compactPhone, width } = useResponsiveLayout();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [chartAreaWidth, setChartAreaWidth] = useState<number | null>(null);
  const fallbackChartWidth = Math.max(Math.min(width - (compactPhone ? 56 : 96), 1200), 248);
  const chartWidth = Math.max(chartAreaWidth ?? fallbackChartWidth, compactPhone ? 248 : 320);
  const data = useMemo(
    () =>
      labels.map((label, index) => {
        const value = values[index] ?? 0;
        const isSelected = selectedIndex === index;

        return {
          frontColor: isSelected ? colors.secondary : colors.secondary,
          label,
          onPress: () => setSelectedIndex(index),
          value,
        };
      }),
    [labels, selectedIndex, values]
  );
  const maxValue = Math.max(...values, 0);
  const hasChartData = data.length > 0 && values.some((value) => value > 0);
  const normalizedMax = maxValue > 0 ? maxValue * 1.15 : 1;
  const barWidth = data.length > 0 ? Math.max(Math.min(chartWidth / (data.length * 3.2), 36), 18) : 18;
  const totalBarWidth = data.length * barWidth;
  const centerSpacing = Math.max((chartWidth - barWidth) / 2, compactPhone ? 10 : 16);
  const sideSpacing =
    data.length <= 1
      ? centerSpacing
      : compactPhone
        ? 12
        : 16;
  const availableSpacing = chartWidth - totalBarWidth - sideSpacing * 2;
  const barSpacing = data.length > 1 ? Math.max(availableSpacing / (data.length - 1), 12) : 0;
  const initialSpacing = sideSpacing;
  const endSpacing = sideSpacing;
  const chartPadding = compactPhone ? spacing.xs * 2 : spacing.sm * 2;
  const chartContentWidth = Math.max(chartWidth - chartPadding, 248);

  function handleChartLayout(event: LayoutChangeEvent) {
    const nextWidth = Math.floor(event.nativeEvent.layout.width);

    if (nextWidth > 0) {
      setChartAreaWidth(nextWidth);
    }
  }

  return (
    <View style={styles.wrap}>
      <View onLayout={handleChartLayout} style={[styles.shell, compactPhone && styles.shellCompact]}>
        {!hasChartData ? (
          <View style={[styles.emptyState, compactPhone && styles.emptyStateCompact]}>
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptyDescription}>{emptyDescription}</Text>
          </View>
        ) : (
          <>
            <BarChart
              barBorderRadius={12}
              barWidth={barWidth}
              data={data}
              disableScroll
              frontColor={colors.secondary}
              height={compactPhone ? Math.max(height - 28, 196) : height}
              width={chartContentWidth}
              hideAxesAndRules={false}
              hideOrigin
              hideRules={false}
              initialSpacing={initialSpacing}
              endSpacing={endSpacing}
              isAnimated
              maxValue={normalizedMax}
              noOfSections={5}
              roundedTop
              rulesColor={colors.borderPanel}
              rulesThickness={1}
              showFractionalValues={false}
              spacing={barSpacing}
              xAxisColor={colors.borderPanel}
              xAxisLabelTextStyle={styles.xAxisLabel}
              xAxisThickness={1}
              yAxisColor={colors.borderPanel}
              yAxisLabelWidth={44}
              yAxisTextStyle={styles.yAxisLabel}
              formatYLabel={formatCompactTick}
            />

            <View style={styles.valueBanner}>
              {selectedIndex !== null ? (
                <>
                  <View style={styles.valueBannerLeft}>
                    <Text style={styles.valueBannerLabel}>SELECTED</Text>
                    <Text style={styles.valueBannerTitle}>{labels[selectedIndex]}</Text>
                  </View>
                  <View style={styles.valueBannerRight}>
                    <Text style={styles.valueBannerAmount}>
                      {formatPeso(values[selectedIndex] ?? 0)}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={styles.valueBannerHint}>
                  Tap a bar to see the exact amount.
                </Text>
              )}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  shell: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.borderPanel,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: 14,
    paddingHorizontal: spacing.sm,
    paddingTop: 10,
    width: '100%',
  },
  shellCompact: {
    paddingBottom: 10,
    paddingHorizontal: spacing.xs,
    paddingTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 208,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  emptyStateCompact: {
    minHeight: 186,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  emptyTitle: {
    color: colors.textHeading,
    ...textRoles.value,
    fontSize: 15,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptyDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 19,
    textAlign: 'center',
  },
  xAxisLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: textSizes.smallCaps,
  },
  yAxisLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: textSizes.smallCaps,
  },
  valueBanner: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.borderPanel,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    minHeight: 62,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  valueBannerLeft: {
    gap: 2,
  },
  valueBannerRight: {
    alignItems: 'flex-end',
  },
  valueBannerLabel: {
    color: colors.textTertiary,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.smallCaps,
    letterSpacing: 1.2,
  },
  valueBannerTitle: {
    color: colors.textStrong,
    fontFamily: fonts.bold,
    fontSize: textSizes.bodyLarge,
  },
  valueBannerAmount: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: textSizes.xlarge,
  },
  valueBannerHint: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    flex: 1,
    textAlign: 'center',
  },
});
