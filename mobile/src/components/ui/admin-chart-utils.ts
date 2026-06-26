import { colors, fonts } from '../../constants/theme';

export const adminChartConfig = {
  backgroundGradientFrom: '#FFFFFF',
  backgroundGradientFromOpacity: 0,
  backgroundGradientTo: '#FFFFFF',
  backgroundGradientToOpacity: 0,
  barPercentage: 0.62,
  color: (opacity = 1) => `rgba(26, 35, 126, ${opacity})`,
  decimalPlaces: 0,
  fillShadowGradientFrom: colors.secondary,
  fillShadowGradientFromOpacity: 0.2,
  fillShadowGradientTo: colors.secondary,
  fillShadowGradientToOpacity: 0.02,
  labelColor: (opacity = 1) => `rgba(95, 103, 122, ${opacity})`,
  propsForBackgroundLines: {
    stroke: '#DCE1EE',
    strokeDasharray: '4 6',
    strokeWidth: 1,
  },
  propsForDots: {
    fill: colors.secondary,
    r: '4',
    stroke: '#FFFFFF',
    strokeWidth: '2',
  },
  propsForHorizontalLabels: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  propsForLabels: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  propsForVerticalLabels: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  strokeWidth: 2,
  useShadowColorFromDataset: false,
};

export function formatCompactTick(value: string) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return value;
  }

  if (Math.abs(numericValue) >= 1_000_000) {
    return `${(numericValue / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }

  if (Math.abs(numericValue) >= 1_000) {
    return `${(numericValue / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }

  return `${Math.round(numericValue)}`;
}
