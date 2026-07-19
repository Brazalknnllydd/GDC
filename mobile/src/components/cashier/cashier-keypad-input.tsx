import { StyleSheet, Text, View, Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts } from '../../constants/theme';

type CashierKeypadInputProps = {
  value: string;
  isActive: boolean;
  onPress: () => void;
  placeholder?: string;
  prefix?: string;
  style?: StyleProp<ViewStyle>;
};

export function CashierKeypadInput({
  value,
  isActive,
  onPress,
  placeholder = '0',
  prefix = '₱',
  style,
}: CashierKeypadInputProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.moneyField,
        isActive && styles.moneyFieldActive,
        style,
      ]}>
      <View style={styles.leftContainer}>
        <Text style={[styles.moneyPrefix, isActive && styles.moneyPrefixActive]}>{prefix}</Text>
        <Text
          style={[
            styles.moneyValue,
            isActive && styles.moneyValueActive,
            !value && styles.placeholderText,
          ]}>
          {value || placeholder}
        </Text>
      </View>
      {isActive ? (
        <View style={styles.activeInputBadge}>
          <Text style={styles.activeInputBadgeText}>ACTIVE</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  moneyField: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D8DDEB',
    borderRadius: radius.md,
    borderWidth: 1.2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  moneyFieldActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#3142BD',
    borderWidth: 1.5,
  },
  leftContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  moneyPrefix: {
    color: '#697285',
    fontFamily: fonts.bold,
    fontSize: 18,
    marginRight: spacing.sm,
  },
  moneyPrefixActive: {
    color: '#3142BD',
  },
  moneyValue: {
    color: '#1A2030',
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  moneyValueActive: {
    color: '#1A237E',
  },
  placeholderText: {
    color: '#96A0B5',
    fontFamily: fonts.regular,
  },
  activeInputBadge: {
    backgroundColor: '#E0E7FF',
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  activeInputBadgeText: {
    color: '#3142BD',
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.6,
  },
});
