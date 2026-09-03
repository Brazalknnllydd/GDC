import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MapPin, Pencil, Phone, Trash2, UserCircle2 } from 'lucide-react-native';

import { colors, fonts, textSizes } from '../../constants/theme';
import { ActionIconButton } from '../ui/action-icon-button';

export const cashierCustomerTableColumns = {
  actions: 82,
  address: 150,
  customer: 250,
  notes: 200,
  phone: 150,
};

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
        {onEdit ? (
          <ActionIconButton accessibilityLabel={`Edit customer ${name}`} icon={Pencil} onPress={onEdit} />
        ) : null}
        {onDelete ? (
          <ActionIconButton accessibilityLabel={`Delete customer ${name}`} icon={Trash2} onPress={onDelete} />
        ) : null}
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
    flexDirection: 'row',
    minWidth: 0,
  },
  nameCol: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
    paddingRight: 12,
    width: cashierCustomerTableColumns.customer,
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
    minWidth: 0,
    paddingRight: 12,
    width: cashierCustomerTableColumns.phone,
  },
  descCol: {
    minWidth: 0,
    paddingRight: 12,
    width: cashierCustomerTableColumns.notes,
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
    width: cashierCustomerTableColumns.actions,
  },
});
