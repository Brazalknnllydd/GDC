import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MoreVertical, Package, Pencil } from 'lucide-react-native';

import { colors, fonts } from '../../constants/theme';
import { SurfaceCard } from './surface-card';

type ProductListItemProps = {
  category: string;
  emoji: string;
  low?: boolean;
  name: string;
  price: string;
  sku: string;
  unitsText: string;
};

export function ProductListItem({
  category,
  emoji,
  low = false,
  name,
  price,
  sku,
  unitsText,
}: ProductListItemProps) {
  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.thumb}>
        <Text style={styles.thumbEmoji}>{emoji}</Text>
        {low && (
          <View style={styles.lowBadge}>
            <Text style={styles.lowBadgeText}>LOW</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.name}>{name}</Text>
          <Pressable style={styles.moreButton}>
            <MoreVertical color="#6A6F82" size={18} strokeWidth={2} />
          </Pressable>
        </View>

        <Text style={styles.meta}>
          {sku} <Text style={styles.category}>• {category}</Text>
        </Text>
        <Text style={[styles.units, low && styles.unitsLow]}>{unitsText}</Text>

        <View style={styles.bottomRow}>
          <Text style={styles.price}>{price}</Text>
          <Pressable style={styles.editButton}>
            <Pencil color={colors.secondary} size={16} strokeWidth={2.2} />
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        </View>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 14,
  },
  thumb: {
    alignItems: 'center',
    backgroundColor: '#132A3E',
    borderRadius: 12,
    height: 112,
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
    position: 'relative',
    width: 112,
  },
  thumbEmoji: {
    fontSize: 54,
  },
  lowBadge: {
    backgroundColor: '#E3342F',
    borderRadius: 6,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    position: 'absolute',
    right: 8,
  },
  lowBadgeText: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  body: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    color: '#1A1D26',
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 20,
    marginRight: 8,
  },
  moreButton: {
    paddingTop: 2,
  },
  meta: {
    color: '#3E4453',
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 6,
  },
  category: {
    color: colors.secondary,
    fontFamily: fonts.medium,
  },
  units: {
    color: '#3E4453',
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 6,
  },
  unitsLow: {
    color: '#D11D1D',
    fontFamily: fonts.medium,
  },
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  price: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: 20,
  },
  editButton: {
    alignItems: 'center',
    borderColor: colors.secondary,
    borderRadius: 14,
    borderWidth: 1.4,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 18,
  },
  editText: {
    color: colors.secondary,
    fontFamily: fonts.medium,
    fontSize: 16,
    marginLeft: 8,
  },
});
