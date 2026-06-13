import { StyleSheet, Text, View } from 'react-native';

import { radius } from '../../constants/design-system';
import { colors, textRoles } from '../../constants/theme';

type CategoryPerformanceRowProps = {
  label: string;
  percentage: number;
};

export function CategoryPerformanceRow({
  label,
  percentage,
}: CategoryPerformanceRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{percentage}%</Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: '#1F2330',
    ...textRoles.body,
  },
  value: {
    color: '#3E4455',
    ...textRoles.label,
  },
  track: {
    backgroundColor: '#E6E8EF',
    borderRadius: radius.round,
    height: 7,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: colors.secondary,
    borderRadius: radius.round,
    height: '100%',
  },
});
