import { StyleSheet, Text, View } from 'react-native';
import { UserRound } from 'lucide-react-native';

import { SurfaceCard } from '../ui/surface-card';
import { radius, spacing } from '../../constants/design-system';
import { colors, textRoles, textSizes } from '../../constants/theme';
import { useResponsiveLayout } from '../../hooks/use-responsive-layout';

type CashierAccessCardProps = {
  allowedCategories: Array<{
    id: number;
    name: string;
  }>;
  createdAt: string;
  name: string;
  role: string;
  username: string;
};

export function CashierAccessCard({
  allowedCategories,
  createdAt,
  name,
  role,
  username,
}: CashierAccessCardProps) {
  const { compactPhone } = useResponsiveLayout();

  return (
    <SurfaceCard style={[styles.card, compactPhone && styles.cardCompact]}>
      <View style={[styles.header, compactPhone && styles.headerCompact]}>
        <View style={styles.identityRow}>
          <View style={styles.avatar}>
            <UserRound color={colors.secondary} size={18} strokeWidth={2.1} />
          </View>
          <View style={styles.identityText}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.meta}>
              @{username} | {role}
            </Text>
          </View>
        </View>
        <Text style={styles.createdAt}>
          {new Date(createdAt).toLocaleDateString('en-PH', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </Text>
      </View>

      <Text style={styles.assignmentLabel}>Allowed categories</Text>
      <View style={styles.categoryWrap}>
        {allowedCategories.length > 0 ? (
          allowedCategories.map((category) => (
            <View key={category.id} style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{category.name}</Text>
            </View>
          ))
        ) : (
          <View style={styles.categoryPillMuted}>
            <Text style={styles.categoryPillMutedText}>All categories</Text>
          </View>
        )}
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  cardCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerCompact: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  identityRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.round,
    height: 40,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 40,
  },
  identityText: {
    flex: 1,
  },
  name: {
    color: colors.textStrong,
    ...textRoles.value,
    fontSize: 17,
    marginBottom: 2,
  },
  meta: {
    color: colors.textTertiary,
    ...textRoles.label,
    fontSize: textSizes.small + 1,
  },
  createdAt: {
    color: colors.textSubtle,
    ...textRoles.label,
    fontSize: textSizes.small,
    marginTop: 2,
  },
  assignmentLabel: {
    color: colors.textSecondary,
    ...textRoles.label,
    fontSize: textSizes.small,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryPill: {
    backgroundColor: colors.surfaceBrandSoft,
    borderColor: colors.borderInfoStrong,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  categoryPillText: {
    color: colors.secondary,
    ...textRoles.label,
    fontSize: textSizes.small,
  },
  categoryPillMuted: {
    backgroundColor: colors.surfaceNeutral,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  categoryPillMutedText: {
    color: colors.textTertiary,
    ...textRoles.label,
    fontSize: textSizes.small,
  },
});
