import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors } from '../../constants/theme';

// ---------------------------------------------------------------------------
// Primitive shimmer box
// ---------------------------------------------------------------------------
type SkeletonBoxProps = {
  borderRadius?: number;
  height: number;
  style?: object;
  width?: number | `${number}%`;
};

function SkeletonBox({ borderRadius = radius.md, height, style, width }: SkeletonBoxProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  return (
    <Animated.View
      style={[
        { backgroundColor: colors.borderSoft, borderRadius, height, opacity, width },
        style,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Skeleton product card — matches CashierProductCard proportions
// ---------------------------------------------------------------------------
function SkeletonProductCard() {
  return (
    <View style={styles.cardWrap}>
      <SkeletonBox height={90} borderRadius={radius.lg} />
      <SkeletonBox height={11} width="70%" style={{ marginTop: spacing.sm }} />
      <SkeletonBox height={10} width="45%" style={{ marginTop: spacing.xs }} />
      <SkeletonBox height={28} borderRadius={radius.round} style={{ marginTop: spacing.sm }} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Full register skeleton
// ---------------------------------------------------------------------------
export function CashierRegisterSkeleton() {
  return (
    <View style={styles.root}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <SkeletonBox height={20} width="40%" />
          <SkeletonBox height={11} width="28%" style={{ marginTop: spacing.xs }} />
        </View>
        <SkeletonBox height={52} width={120} borderRadius={radius.lg} />
      </View>

      {/* Search bar */}
      <SkeletonBox height={44} borderRadius={radius.lg} style={styles.fullWidth} />

      {/* Category chips */}
      <View style={styles.chipsRow}>
        {[70, 55, 80, 60].map((w, i) => (
          <SkeletonBox key={i} height={32} width={w} borderRadius={radius.round} />
        ))}
      </View>

      {/* 2-column product grid */}
      <View style={styles.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={styles.gridCell}>
            <SkeletonProductCard />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerText: {
    gap: spacing.xs,
  },
  fullWidth: {
    width: '100%',
    marginBottom: spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridCell: {
    width: '48.5%',
  },
  cardWrap: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
});
