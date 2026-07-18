import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';
import { Image } from 'expo-image';

import { radius, spacing } from '../../constants/design-system';
import { colors, textRoles, textSizes } from '../../constants/theme';
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
    padding: spacing.md + 2,
  },
  cardCompact: {
    alignItems: 'flex-start',
  },
  thumb: {
    alignItems: 'center',
    backgroundColor: colors.textDark,
    borderRadius: radius.md,
    height: 112,
    justifyContent: 'center',
    marginRight: spacing.lg,
    overflow: 'hidden',
    position: 'relative',
    width: 112,
  },
  thumbImage: {
    height: '100%',
    width: '100%',
  },
  thumbGlyph: {
    color: colors.textInverse,
    ...textRoles.value,
    fontSize: textSizes.xlarge,
    letterSpacing: 2,
  },
  lowBadge: {
    backgroundColor: colors.dangerAccent,
    borderRadius: radius.sm - 4,
    bottom: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    position: 'absolute',
    right: 8,
  },
  lowBadgeText: {
    color: colors.textInverse,
    ...textRoles.label,
    fontSize: textSizes.xsmall,
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
    color: colors.textStrong,
    flex: 1,
    ...textRoles.value,
    fontSize: textSizes.titleLarge,
    marginRight: spacing.sm,
  },
  meta: {
    color: colors.textSoft,
    ...textRoles.label,
    marginTop: spacing.sm - 2,
  },
  category: {
    color: colors.secondary,
    ...textRoles.label,
  },
  units: {
    color: colors.textSoft,
    ...textRoles.label,
    marginTop: spacing.sm - 2,
  },
  unitsLow: {
    color: colors.danger,
  },
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  bottomRowCompact: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    gap: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
  },
  actionsCompact: {
    width: '100%',
  },
  price: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: textSizes.titleLarge,
  },
});
