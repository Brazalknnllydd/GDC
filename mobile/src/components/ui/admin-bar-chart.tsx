import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

import { adminChartConfig } from './admin-chart-utils';

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
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(Math.min(width - 96, 920), 280);

  return (
    <View style={styles.wrap}>
      <BarChart
        chartConfig={adminChartConfig}
        data={{
          datasets: [{ data: values.length > 0 ? values : [0] }],
          labels: labels.length > 0 ? labels : ['No data'],
        }}
        flatColor
        fromZero
        height={height}
        showBarTops={false}
        showValuesOnTopOfBars={false}
        style={styles.chart}
        width={chartWidth}
        withCustomBarColorFromData={false}
        withInnerLines
        withHorizontalLabels
        withVerticalLabels
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
