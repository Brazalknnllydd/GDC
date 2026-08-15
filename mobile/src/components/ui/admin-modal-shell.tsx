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

type AdminModalShellProps = {
  children: ReactNode;
  compact?: boolean;
  footer?: ReactNode;
  headerLead?: ReactNode;
  height?: ViewStyle['height'];
  maxHeight?: ViewStyle['maxHeight'];
  onClose: () => void;
  title: string;
  visible: boolean;
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
  compact = false,
  footer,
  headerLead,
  height,
  maxHeight = '92%',
  onClose,
  title,
  visible,
}: AdminModalShellProps) {
  const { height: viewportHeight, width } = useWindowDimensions();
  const modalWidth = Math.min(width - 24, width >= 900 ? 720 : width >= 640 ? 640 : width);
  const resolvedHeight = resolveViewportLength(height, viewportHeight);
  const resolvedMaxHeight = resolveViewportLength(maxHeight, viewportHeight);

  if (!visible) return null;

  return (
    <Portal>
      <Pressable onPress={onClose} style={styles.backdropOverlay}>
        <View style={{ width: modalWidth }}>
          <Surface
            style={[
              styles.card,
              {
                height: resolvedHeight,
                maxHeight: resolvedMaxHeight,
                width: modalWidth,
              },
            ]}>
            <View style={[styles.header, compact ? styles.headerCompact : undefined]}>
              <View style={styles.titleRow}>
                {headerLead}
                <Text style={[styles.title, compact ? styles.titleCompact : undefined]}>
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

            <View style={[styles.body, compact ? styles.bodyCompact : undefined]}>{children}</View>

            {footer ? (
              <View style={[styles.footer, compact ? styles.footerCompact : undefined]}>
                {footer}
              </View>
            ) : null}
          </Surface>
        </View>
      </Pressable>
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
    paddingHorizontal: 12,
  },
  card: {
    alignSelf: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    elevation: 3,
    flexShrink: 1,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  headerCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    color: colors.textHeading,
    ...textRoles.value,
    fontSize: 17,
  },
  titleCompact: {
    fontSize: 16,
  },
  closeButton: {
    margin: 0,
  },
  body: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  bodyCompact: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  footerCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
});
