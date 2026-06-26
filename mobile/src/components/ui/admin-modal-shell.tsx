import type { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import { X } from 'lucide-react-native';
import { IconButton, Modal, Portal, Surface } from 'react-native-paper';

import { radius, spacing } from '../../constants/design-system';
import { colors, textRoles } from '../../constants/theme';

type AdminModalShellProps = {
  children: ReactNode;
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
  footer,
  headerLead,
  height,
  maxHeight = '92%',
  onClose,
  title,
  visible,
}: AdminModalShellProps) {
  const { height: viewportHeight, width } = useWindowDimensions();
  const modalWidth = Math.min(width - 24, width >= 900 ? 760 : width >= 640 ? 680 : width);
  const resolvedHeight = resolveViewportLength(height, viewportHeight);
  const resolvedMaxHeight = resolveViewportLength(maxHeight, viewportHeight);

  return (
    <Portal>
      <Modal
        contentContainerStyle={styles.backdrop}
        dismissable
        onDismiss={onClose}
        visible={visible}>
        <Surface
          style={[
            styles.card,
            {
              height: resolvedHeight,
              maxHeight: resolvedMaxHeight,
              width: modalWidth,
            },
          ]}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              {headerLead}
              <Text style={styles.title}>{title}</Text>
            </View>
            <IconButton
              icon={() => <X color="#666C7A" size={25} strokeWidth={2.1} />}
              onPress={onClose}
              size={22}
              style={styles.closeButton}
            />
          </View>

          <View style={styles.body}>{children}</View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Surface>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(29, 31, 42, 0.34)',
    justifyContent: 'center',
    marginHorizontal: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  card: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    display: 'flex',
    elevation: 3,
    flexShrink: 1,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: '#E8EAF1',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    color: '#292E3D',
    ...textRoles.value,
    fontSize: 18,
  },
  closeButton: {
    margin: 0,
  },
  body: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  footer: {
    borderTopColor: '#E8EAF1',
    borderTopWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
});
