import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';
import { Image } from 'expo-image';

import { colors, textRoles } from '../../constants/theme';
import { resolveApiAssetUrl } from '../../lib/api';
import { AppButton } from './app-button';
import { SurfaceCard } from './surface-card';

type ProductListItemProps = {
  category: string;
  imageUrl?: string | null;
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
  imageUrl,
  low = false,
  name,
  onDelete,
  onEdit,
  price,
  sku,
  unitsText,
}: ProductListItemProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 430;
  const resolvedImageUrl = resolveApiAssetUrl(imageUrl);

  return (
    <SurfaceCard style={[styles.card, isCompact && styles.cardCompact]}>
      <View style={styles.thumb}>
        {resolvedImageUrl ? (
          <Image contentFit="cover" source={{ uri: resolvedImageUrl }} style={styles.thumbImage} />
        ) : (
          <Text style={styles.thumbGlyph}>PKG</Text>
        )}
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

        <View style={[styles.bottomRow, isCompact && styles.bottomRowCompact]}>
          <Text style={styles.price}>{price}</Text>
          <View style={[styles.actions, isCompact && styles.actionsCompact]}>
            <AppButton
              fullWidth={false}
              icon={({ color, size }) => <Trash2 color={color} size={size} strokeWidth={2.1} />}
              label="Delete"
              onPress={onDelete}
              size="sm"
              variant="dangerOutline"
            />
            <AppButton
              fullWidth={false}
              icon={({ color, size }) => <Pencil color={color} size={size} strokeWidth={2.2} />}
              label="Edit"
              onPress={onEdit}
              size="sm"
              variant="secondary"
            />
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
  cardCompact: {
    alignItems: 'flex-start',
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
  thumbImage: {
    height: '100%',
    width: '100%',
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
  bottomRowCompact: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    gap: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionsCompact: {
    width: '100%',
  },
  price: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: 20,
  },
});
