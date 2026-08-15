import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MapPin, Pencil, Phone, Trash2, UserCircle2 } from 'lucide-react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts, textSizes } from '../../constants/theme';

type CashierCustomerListItemProps = {
  name: string;
  phoneNumber?: string | null;
  address?: string | null;
  description?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onPress?: () => void;
};

export function CashierCustomerListItem({
  name,
  phoneNumber,
  address,
  description,
  onEdit,
  onDelete,
  onPress,
}: CashierCustomerListItemProps) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      {/* Scrollable data columns */}
      <View style={styles.dataArea}>
        {/* Avatar + Name */}
        <View style={styles.nameCol}>
          <View style={styles.avatar}>
            <UserCircle2 color={colors.textInverse} size={18} strokeWidth={2} />
          </View>
          <Text style={styles.nameText} numberOfLines={1}>{name}</Text>
        </View>

        {/* Phone */}
        <View style={styles.col}>
          {phoneNumber ? (
            <View style={styles.metaRow}>
              <Phone color={colors.textSubtle} size={12} strokeWidth={2} />
              <Text style={styles.metaText} numberOfLines={1}>{phoneNumber}</Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>—</Text>
          )}
        </View>

        {/* Address */}
        <View style={styles.col}>
          {address ? (
            <View style={styles.metaRow}>
              <MapPin color={colors.textSubtle} size={12} strokeWidth={2} />
              <Text style={styles.metaText} numberOfLines={1}>{address}</Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>—</Text>
          )}
        </View>

        {/* Description */}
        <View style={styles.descCol}>
          <Text style={styles.metaText} numberOfLines={1}>
            {description?.trim() || '—'}
          </Text>
        </View>
      </View>

      {/* Actions — fixed at right edge */}
      <View style={styles.actionsCol}>
        <Pressable onPress={onEdit} style={styles.actionBtn}>
          <Pencil color="#667085" size={16} strokeWidth={2} />
        </Pressable>
        <Pressable onPress={onDelete} style={styles.actionBtn}>
          <Trash2 color="#667085" size={16} strokeWidth={2} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#EAECF0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dataArea: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
  },
  nameCol: {
    alignItems: 'center',
    flex: 2.5,
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 20,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  nameText: {
    color: '#101828',
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.body,
  },
  col: {
    flex: 1.5,
    minWidth: 0,
  },
  descCol: {
    flex: 2,
    minWidth: 0,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  metaText: {
    color: '#475467',
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
  },
  emptyText: {
    color: '#D0D5DD',
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
  },
  actionsCol: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'flex-end',
    width: 72,
  },
  actionBtn: {
    alignItems: 'center',
    borderRadius: radius.round,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
});
