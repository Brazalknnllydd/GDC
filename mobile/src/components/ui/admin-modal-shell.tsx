import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import { X } from 'lucide-react-native';
import { IconButton, Portal, Surface } from 'react-native-paper';

import { radius, spacing } from '../../constants/design-system';
import { colors, textRoles } from '../../constants/theme';
import { useResponsiveLayout } from '../../hooks/use-responsive-layout';

type AdminModalShellProps = {
  children: ReactNode;
  compact?: boolean;
  footer?: ReactNode;
  headerLead?: ReactNode;
  height?: ViewStyle['height'];
  maxWidth?: number;
  maxHeight?: ViewStyle['maxHeight'];
  onClose: () => void;
  title: string;
  visible: boolean;
  widthRatio?: number;
};

function resolveViewportLength(
  value: ViewStyle['height'] | ViewStyle['maxHeight'] | undefined,
  viewportHeight: number
) {
  if (typeof value === 'string' && value.endsWith('%')) {
    const parsed = Number.parseFloat(value);

    if (!Number.isNaN(parsed)) {
      return viewportHeight * (parsed / 100);
    }
  }

  return value;
}

export function AdminModalShell({
  children,
  compact,
  footer,
  headerLead,
  height,
  maxWidth,
  maxHeight,
  onClose,
  title,
  visible,
  widthRatio,
}: AdminModalShellProps) {
  const { height: viewportHeight, width } = useWindowDimensions();
  const { isTablet, isWideTablet } = useResponsiveLayout();
  const resolvedCompact = compact ?? !isTablet;
  const resolvedMaxWidth = maxWidth ?? (isWideTablet ? 740 : isTablet ? 580 : 450);
  const resolvedWidthRatio = widthRatio ?? (isWideTablet ? 0.6 : isTablet ? 0.68 : 0.9);
  const modalWidth = Math.min(
    width - (isTablet ? 160 : 40),
    resolvedMaxWidth,
    width * resolvedWidthRatio
  );
  const resolvedHeight = resolveViewportLength(height, viewportHeight);
  const resolvedMaxHeight = resolveViewportLength(maxHeight ?? (isTablet ? '86%' : '86%'), viewportHeight);

  if (!visible) return null;

  return (
    <Portal>
      <View style={styles.backdropOverlay}>
        <Pressable onPress={onClose} style={styles.backdropPressable} />
        <View style={{ width: modalWidth }}>
          <Surface
            style={[
              styles.card,
              resolvedCompact ? styles.cardCompact : undefined,
              {
                height: resolvedHeight,
                maxHeight: resolvedMaxHeight,
                width: modalWidth,
              },
            ]}>
            <View style={[styles.header, resolvedCompact ? styles.headerCompact : undefined]}>
              <View style={styles.titleRow}>
                {headerLead}
                <Text
                  numberOfLines={2}
                  style={[styles.title, resolvedCompact ? styles.titleCompact : undefined]}>
                  {title}
                </Text>
              </View>
              <IconButton
                icon={() => <X color={colors.textTertiary} size={25} strokeWidth={2.1} />}
                onPress={onClose}
                size={22}
                style={styles.closeButton}
              />
            </View>

            <View style={[styles.body, resolvedCompact ? styles.bodyCompact : undefined]}>{children}</View>

            {footer ? (
              <View style={[styles.footer, resolvedCompact ? styles.footerCompact : undefined]}>
                {footer}
              </View>
            ) : null}
          </Surface>
        </View>
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  backdropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlayScrim,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backdropPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    alignSelf: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    elevation: 3,
    flexShrink: 1,
    overflow: 'hidden',
  },
  cardCompact: {
    borderRadius: radius.lg,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  headerCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    color: colors.textHeading,
    flexShrink: 1,
    ...textRoles.value,
    fontSize: 16,
  },
  titleCompact: {
    fontSize: 15,
  },
  closeButton: {
    margin: 0,
  },
  body: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 2,
  },
  bodyCompact: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  footer: {
    borderTopColor: colors.borderPanel,
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  footerCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
