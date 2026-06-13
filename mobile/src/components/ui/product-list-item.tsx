import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';

import { colors, textRoles, textSizes } from '../../constants/theme';
import { SurfaceCard } from './surface-card';

type ProductListItemProps = {
  category: string;
  low?: boolean;
  name: string;
  onDelete?: () => void;
  onEdit?: () => void;
  price: string;
  sku: string;
  unitsText: string;
};

export function ProductListItem({
  category,
  low = false,
  name,
  onDelete,
  onEdit,
  price,
  sku,
  unitsText,
}: ProductListItemProps) {
  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.thumb}>
        <Text style={styles.thumbGlyph}>PKG</Text>
        {low ? (
          <View style={styles.lowBadge}>
            <Text style={styles.lowBadgeText}>LOW</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.name}>{name}</Text>
        </View>

        <Text style={styles.meta}>
          {sku} <Text style={styles.category}>• {category}</Text>
        </Text>
        <Text style={[styles.units, low && styles.unitsLow]}>{unitsText}</Text>

        <View style={styles.bottomRow}>
          <Text style={styles.price}>{price}</Text>
          <View style={styles.actions}>
            <Pressable onPress={onDelete} style={styles.deleteButton}>
              <Trash2 color="#B3261E" size={16} strokeWidth={2.1} />
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
            <Pressable onPress={onEdit} style={styles.editButton}>
              <Pencil color={colors.secondary} size={16} strokeWidth={2.2} />
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
          </View>
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
  thumbGlyph: {
    color: '#FFFFFF',
    ...textRoles.value,
    fontSize: 24,
    letterSpacing: 2,
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
    ...textRoles.label,
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
    ...textRoles.value,
    fontSize: 20,
    marginRight: 8,
  },
  meta: {
    color: '#3E4453',
    ...textRoles.label,
    marginTop: 6,
  },
  category: {
    color: colors.secondary,
    ...textRoles.label,
  },
  units: {
    color: '#3E4453',
    ...textRoles.label,
    marginTop: 6,
  },
  unitsLow: {
    color: '#D11D1D',
  },
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  price: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: 20,
  },
  deleteButton: {
    alignItems: 'center',
    borderColor: '#E3B6B2',
    borderRadius: 14,
    borderWidth: 1.4,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 14,
  },
  deleteText: {
    color: '#B3261E',
    ...textRoles.label,
    fontSize: textSizes.medium,
    marginLeft: 8,
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
    ...textRoles.label,
    fontSize: textSizes.medium,
    marginLeft: 8,
  },
});
