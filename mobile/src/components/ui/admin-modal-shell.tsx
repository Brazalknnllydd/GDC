import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { X } from 'lucide-react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, textRoles } from '../../constants/theme';

type AdminModalShellProps = {
  children: ReactNode;
  footer?: ReactNode;
  headerLead?: ReactNode;
  maxHeight?: ViewStyle['maxHeight'];
  onClose: () => void;
  title: string;
  visible: boolean;
};

export function AdminModalShell({
  children,
  footer,
  headerLead,
  maxHeight = '92%',
  onClose,
  title,
  visible,
}: AdminModalShellProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { maxHeight }]}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              {headerLead}
              <Text style={styles.title}>{title}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X color="#666C7A" size={25} strokeWidth={2.1} />
            </Pressable>
          </View>

          <View style={styles.body}>{children}</View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(29, 31, 42, 0.34)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
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
    padding: 2,
  },
  body: {
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
