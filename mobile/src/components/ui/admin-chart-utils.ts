import { colorChannels, colors, fonts, textSizes, withOpacity } from '../../constants/theme';

export const adminChartConfig = {
  backgroundGradientFrom: colors.card,
  backgroundGradientFromOpacity: 0,
  backgroundGradientTo: colors.card,
  backgroundGradientToOpacity: 0,
  barPercentage: 0.62,
  color: (opacity = 1) => withOpacity(colorChannels.secondary, opacity),
  decimalPlaces: 0,
  fillShadowGradientFrom: colors.secondary,
  fillShadowGradientFromOpacity: 0.2,
  fillShadowGradientTo: colors.secondary,
  fillShadowGradientToOpacity: 0.02,
  labelColor: (opacity = 1) => withOpacity(colorChannels.textSecondary, opacity),
  propsForBackgroundLines: {
    stroke: colors.borderPanel,
    strokeDasharray: '4 6',
    strokeWidth: 1,
  },
  propsForDots: {
    fill: colors.secondary,
    r: '4',
    stroke: colors.card,
    strokeWidth: '2',
  },
  propsForHorizontalLabels: {
    fontFamily: fonts.medium,
    fontSize: textSizes.smallCaps,
  },
  propsForLabels: {
    fontFamily: fonts.medium,
    fontSize: textSizes.smallCaps,
  },
  propsForVerticalLabels: {
    fontFamily: fonts.medium,
    fontSize: textSizes.smallCaps,
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
