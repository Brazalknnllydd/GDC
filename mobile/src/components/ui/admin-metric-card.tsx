import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { textRoles, textSizes } from '../../constants/theme';
import { SurfaceCard } from './surface-card';

type MetricTone = 'default' | 'success' | 'danger' | 'positive' | 'negative' | 'neutral';
type TonePalette = Record<MetricTone, { detail: string; value: string }>;

type AdminMetricCardProps = {
  title: string;
  value: string;
  detail: string;
  tone?: MetricTone;
  style?: StyleProp<ViewStyle>;
  valueColor?: string;
  titleColor?: string;
  detailColor?: string;
  minHeight?: number;
  width?: ViewStyle['width'];
  paddingHorizontal?: number;
  paddingVertical?: number;
  titleMarginBottom?: number;
  valueMarginBottom?: number;
  titleLetterSpacing?: number;
  valueFontSize?: number;
  valueLineHeight?: number;
};

const toneStyles: TonePalette = {
  default: {
    detail: '#3E4454',
    value: '#111111',
  },
  success: {
    detail: '#119B39',
    value: '#119B39',
  },
  danger: {
    detail: '#D11D1D',
    value: '#D11D1D',
  },
  positive: {
    detail: '#0E9F3E',
    value: '#111D77',
  },
  negative: {
    detail: '#C62828',
    value: '#111D77',
  },
  neutral: {
    detail: '#677085',
    value: '#111D77',
  },
};

export function AdminMetricCard({
  title,
  value,
  detail,
  tone = 'default',
  style,
  valueColor,
  titleColor = '#2F3546',
  detailColor,
  minHeight = 158,
  width = '47.5%',
  paddingHorizontal = 22,
  paddingVertical = 22,
  titleMarginBottom = 24,
  valueMarginBottom = 8,
  titleLetterSpacing = 2.2,
  valueFontSize = 24,
  valueLineHeight = 29,
}: AdminMetricCardProps) {
  const palette = toneStyles[tone];

  return (
    <SurfaceCard
      style={[
        styles.card,
        {
          minHeight,
          paddingHorizontal,
          paddingVertical,
          width,
        },
        style,
      ]}>
      <Text
        style={[
          styles.title,
          {
            color: titleColor,
            letterSpacing: titleLetterSpacing,
            marginBottom: titleMarginBottom,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.value,
          {
            color: valueColor || palette.value,
            fontSize: valueFontSize,
            lineHeight: valueLineHeight,
            marginBottom: valueMarginBottom,
          },
        ]}>
        {value}
      </Text>
      <Text style={[styles.detail, { color: detailColor || palette.detail }]}>{detail}</Text>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {},
  title: {
    ...textRoles.label,
    fontSize: textSizes.medium,
  },
  value: {
    ...textRoles.value,
  },
  detail: {
    ...textRoles.label,
  },
});
