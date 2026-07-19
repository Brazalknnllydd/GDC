import { StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { colors, fonts, textSizes } from '../../constants/theme';
import { formatCompactTick } from './admin-chart-utils';
import { useResponsiveLayout } from '../../hooks/use-responsive-layout';

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
  const chartWidth = Math.max(Math.min(width - (compactPhone ? 56 : 96), 920), 248);
  const primaryData = labels.map((label, index) => ({
    label,
    value: datasets[0]?.data[index] ?? 0,
  }));
  const secondaryData = labels.map((_, index) => ({
    value: datasets[1]?.data[index] ?? 0,
  }));
  const maxValue = Math.max(
    ...datasets.flatMap((dataset) => dataset.data),
    0
  );

  return (
    <View style={styles.wrap}>
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
        height={compactPhone ? Math.max(height - 24, 188) : height}
        hideDataPoints
        hideOrigin
        hideRules={false}
        initialSpacing={compactPhone ? 10 : 14}
        isAnimated
        maxValue={maxValue > 0 ? maxValue : 1}
        noOfSections={4}
        rulesColor={colors.borderPanel}
        rulesThickness={1}
        spacing={Math.max(Math.min(chartWidth / Math.max(labels.length * 1.8, 6), 56), 28)}
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
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
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
});
