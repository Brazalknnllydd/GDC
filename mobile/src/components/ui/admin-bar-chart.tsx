import { StyleSheet, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { colors, fonts, textSizes } from '../../constants/theme';
import { formatCompactTick } from './admin-chart-utils';
import { useResponsiveLayout } from '../../hooks/use-responsive-layout';

type AdminBarChartProps = {
  height?: number;
  labels: string[];
  values: number[];
};

export function AdminBarChart({
  height = 240,
  labels,
  values,
}: AdminBarChartProps) {
  const { compactPhone, width } = useResponsiveLayout();
  const chartWidth = Math.max(Math.min(width - (compactPhone ? 56 : 96), 920), 248);
  const data = labels.map((label, index) => ({
    frontColor: colors.secondary,
    label,
    value: values[index] ?? 0,
  }));
  const maxValue = Math.max(...values, 0);
  const normalizedMax = maxValue > 0 ? maxValue : 1;
  const initialSpacing = compactPhone ? 10 : 14;
  const barWidth = Math.max(Math.min(chartWidth / (data.length * 2.5), 48), 16);
  const totalBarWidth = data.length * barWidth;
  const remainingSpace = chartWidth - initialSpacing - totalBarWidth;
  const spacing = data.length > 0 ? Math.max(remainingSpace / data.length, 10) : 10;
  const endSpacing = spacing;

  return (
    <View style={styles.wrap}>
      <BarChart
        barBorderRadius={8}
        barWidth={barWidth}
        data={data.length > 0 ? data : [{ label: 'No data', value: 0, frontColor: colors.secondary }]}
        disableScroll
        frontColor={colors.secondary}
        height={compactPhone ? Math.max(height - 28, 196) : height}
        width={chartWidth}
        hideAxesAndRules={false}
        hideOrigin
        hideRules={false}
        initialSpacing={initialSpacing}
        endSpacing={endSpacing}
        isAnimated
        maxValue={normalizedMax}
        noOfSections={4}
        roundedTop
        rulesColor={colors.borderPanel}
        rulesThickness={1}
        showFractionalValues={false}
        spacing={spacing}
        xAxisColor={colors.borderPanel}
        xAxisLabelTextStyle={styles.xAxisLabel}
        xAxisThickness={1}
        yAxisColor={colors.borderPanel}
        yAxisLabelWidth={44}
        yAxisTextStyle={styles.yAxisLabel}
        formatYLabel={formatCompactTick}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: '100%',
    paddingBottom: 8,
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
});
