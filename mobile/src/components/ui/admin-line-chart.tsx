import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { colors, fonts, textSizes } from '../../constants/theme';
import { formatCompactTick } from './admin-chart-utils';
import { useResponsiveLayout } from '../../hooks/use-responsive-layout';
import { formatPeso } from '../../lib/product-utils';

type AdminLineChartDataset = {
  color: string;
  data: number[];
};

type AdminLineChartProps = {
  datasets: AdminLineChartDataset[];
  height?: number;
  labels: string[];
};

export function AdminLineChart({
  datasets,
  height = 220,
  labels,
}: AdminLineChartProps) {
  const { compactPhone, width } = useResponsiveLayout();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [chartAreaWidth, setChartAreaWidth] = useState<number | null>(null);
  const fallbackChartWidth = Math.max(Math.min(width - (compactPhone ? 56 : 96), 1200), 248);
  const chartWidth = Math.max(chartAreaWidth ?? fallbackChartWidth, compactPhone ? 248 : 320);
  const isDenseSeries = labels.length > 12;
  const primaryData = useMemo(
    () =>
      labels.map((label, index) => {
        const value = datasets[0]?.data[index] ?? 0;
        const isSelected = selectedIndex === index;

        return {
          dataPointText: formatPeso(value),
          focusedDataPointLabelComponent: isSelected
            ? () => (
                <View style={styles.valuePill}>
                  <Text style={styles.valuePillText}>{formatPeso(value)}</Text>
                </View>
              )
            : undefined,
          label,
          onPress: () => setSelectedIndex(index),
          value,
        };
      }),
    [datasets, labels, selectedIndex]
  );
  const secondaryData = labels.map((_, index) => ({
    value: datasets[1]?.data[index] ?? 0,
  }));
  const maxValue = Math.max(
    ...datasets.flatMap((dataset) => dataset.data),
    0
  );

  function handleChartLayout(event: LayoutChangeEvent) {
    const nextWidth = Math.floor(event.nativeEvent.layout.width);

    if (nextWidth > 0) {
      setChartAreaWidth(nextWidth);
    }
  }

  return (
    <View style={styles.wrap}>
      <View onLayout={handleChartLayout} style={styles.chartShell}>
        <LineChart
          areaChart={false}
          color={datasets[0]?.color ?? colors.secondary}
          color1={datasets[0]?.color ?? colors.secondary}
          color2={datasets[1]?.color ?? colors.tertiary}
          curvature={0.2}
          curved
          data={primaryData.length > 0 ? primaryData : [{ label: 'No data', value: 0 }]}
          data2={datasets.length > 1 ? secondaryData : undefined}
          disableScroll
          focusEnabled
          height={compactPhone ? Math.max(height - 24, 188) : height}
          hideDataPoints={false}
          hideOrigin
          hideRules={false}
          initialSpacing={isDenseSeries ? 8 : compactPhone ? 10 : 14}
          showDataPointLabelOnFocus
          showDataPointOnFocus
          showTextOnFocus
          isAnimated
          maxValue={maxValue > 0 ? maxValue : 1}
          noOfSections={4}
          focusedDataPointIndex={selectedIndex ?? undefined}
          rulesColor={colors.borderPanel}
          rulesThickness={1}
          spacing={Math.max(
            Math.min(chartWidth / Math.max(labels.length - 1, 1), isDenseSeries ? 22 : 56),
            isDenseSeries ? 10 : 28
          )}
          thickness={3}
          thickness1={3}
          thickness2={3}
          width={chartWidth}
          xAxisColor={colors.borderPanel}
          xAxisLabelTextStyle={styles.xAxisLabel}
          xAxisThickness={1}
          yAxisColor={colors.borderPanel}
          yAxisLabelWidth={44}
          yAxisTextStyle={styles.yAxisLabel}
          formatYLabel={formatCompactTick}
        />
      </View>

      <View style={styles.valueBanner}>
        {selectedIndex !== null ? (
          <>
            <View>
              <Text style={styles.valueBannerLabel}>Selected point</Text>
              <Text style={styles.valueBannerTitle}>{labels[selectedIndex]}</Text>
            </View>
            <Text style={styles.valueBannerAmount}>
              {formatPeso(primaryData[selectedIndex]?.value ?? 0)}
            </Text>
          </>
        ) : (
          <Text style={styles.valueBannerHint}>
            Tap any point to reveal the exact amount.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: '100%',
  },
  chartShell: {
    width: '100%',
  },
  xAxisLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: textSizes.smallCaps,
    marginTop: 8,
  },
  yAxisLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: textSizes.smallCaps,
  },
  valueBanner: {
    alignItems: 'center',
    backgroundColor: colors.surfaceInfo,
    borderColor: colors.borderInfoStrong,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
  },
  valueBannerLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: textSizes.smallCaps,
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  valueBannerTitle: {
    color: colors.textStrong,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.body,
  },
  valueBannerAmount: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: textSizes.large,
  },
  valueBannerHint: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
  },
  valuePill: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  valuePillText: {
    color: colors.textInverse,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.small,
  },
});
