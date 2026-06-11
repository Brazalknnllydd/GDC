import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts } from '../../constants/theme';
import { SurfaceCard } from './surface-card';

type InventoryStatCardProps = {
  title: string;
  value: string;
  detail: string;
  accent?: 'default' | 'danger' | 'success';
  style?: StyleProp<ViewStyle>;
};

export function InventoryStatCard({
  title,
  value,
  detail,
  accent = 'default',
  style,
}: InventoryStatCardProps) {
  return (
    <SurfaceCard style={[styles.card, style]}>
      <Text style={styles.title}>{title}</Text>
      <Text
        style={[
          styles.value,
          accent === 'success' && styles.valueSuccess,
          accent === 'danger' && styles.valueDanger,
        ]}>
        {value}
      </Text>
      <Text
        style={[
          styles.detail,
          accent === 'success' && styles.detailSuccess,
          accent === 'danger' && styles.detailDanger,
        ]}>
        {detail}
      </Text>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 158,
    paddingHorizontal: 22,
    paddingVertical: 22,
    width: '47.5%',
  },
  title: {
    color: '#2F3546',
    fontFamily: fonts.medium,
    fontSize: 18,
    letterSpacing: 2.2,
    marginBottom: 24,
  },
  value: {
    color: '#111111',
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 29,
    marginBottom: 8,
  },
  valueSuccess: {
    color: '#119B39',
  },
  valueDanger: {
    color: '#D11D1D',
  },
  detail: {
    color: '#3E4454',
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  detailSuccess: {
    color: '#119B39',
    fontFamily: fonts.bold,
  },
  detailDanger: {
    color: '#D11D1D',
    fontFamily: fonts.bold,
  },
});
