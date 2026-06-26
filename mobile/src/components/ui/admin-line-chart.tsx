import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

import { adminChartConfig, formatCompactTick } from './admin-chart-utils';

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
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(Math.min(width - 96, 920), 280);

  return (
    <View style={styles.wrap}>
      <LineChart
        bezier
        chartConfig={adminChartConfig}
        data={{
          datasets:
            datasets.length > 0
              ? datasets.map((dataset) => ({
                  color: () => dataset.color,
                  data: dataset.data,
                  strokeWidth: 3,
                }))
              : [{ color: () => '#D1D5DB', data: [0], strokeWidth: 3 }],
          labels: labels.length > 0 ? labels : ['No data'],
        }}
        formatYLabel={formatCompactTick}
        fromZero
        height={height}
        style={styles.chart}
        width={chartWidth}
        withDots={false}
        withInnerLines
        withOuterLines={false}
        withShadow={false}
        yAxisLabel=""
        yAxisSuffix=""
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: '100%',
  },
  chart: {
    borderRadius: 18,
    marginLeft: -20,
  },
});
