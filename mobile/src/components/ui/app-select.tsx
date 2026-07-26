import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';

import { radius, shadows, spacing } from '../../constants/design-system';
import { colors, fonts, textRoles, textSizes } from '../../constants/theme';

export type AppSelectOption = {
  label: string;
  value: string;
};

type AppSelectProps = {
  options: AppSelectOption[] | string[];
  placeholder?: string;
  value: string;
  onValueChange: (value: string) => void;
  style?: any;
};

export function AppSelect({
  options,
  placeholder = 'Select an option',
  value,
  onValueChange,
  style,
}: AppSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { width } = useWindowDimensions();
  const isCompactPhone = width < 430;

  const normalizedOptions: AppSelectOption[] = options.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  return (
    <>
      <Pressable
        onPress={() => setIsOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          pressed && styles.triggerPressed,
          style,
        ]}>
        <Text style={[styles.triggerText, !selectedOption && styles.placeholderText]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown color={colors.textTertiary} size={20} strokeWidth={2} />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsOpen(false)}>
          <View style={[styles.dropdown, isCompactPhone && styles.dropdownCompact]}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>{placeholder}</Text>
            </View>
            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {normalizedOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <Pressable
                    key={opt.value}
                    style={({ pressed }) => [
                      styles.option,
                      isSelected && styles.optionSelected,
                      pressed && styles.optionPressed,
                    ]}
                    onPress={() => {
                      onValueChange(opt.value);
                      setIsOpen(false);
                    }}>
                    <Text
                      style={[
                        styles.optionLabel,
                        isSelected && styles.optionLabelSelected,
                      ]}>
                      {opt.label}
                    </Text>
                    {isSelected ? (
                      <Check color={colors.secondary} size={18} strokeWidth={2.5} />
                    ) : (
                      <View style={{ width: 18 }} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    height: 44,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    minWidth: 160,
  },
  triggerPressed: {
    backgroundColor: colors.surfaceOverlayMuted,
  },
  triggerText: {
    color: colors.textStrong,
    ...textRoles.body,
  },
  placeholderText: {
    color: colors.textSubtle,
  },
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  dropdown: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    maxHeight: 320,
    width: '100%',
    maxWidth: 400,
    ...shadows.floating,
    overflow: 'hidden',
  },
  dropdownCompact: {
    maxWidth: '100%',
  },
  dropdownHeader: {
    borderBottomColor: colors.borderPanel,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dropdownTitle: {
    color: colors.textSecondary,
    ...textRoles.label,
    fontSize: textSizes.small,
    letterSpacing: 0.5,
  },
  optionsList: {
    paddingVertical: spacing.sm,
  },
  option: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  optionPressed: {
    backgroundColor: colors.surfaceOverlayMuted,
  },
  optionSelected: {
    backgroundColor: colors.surfaceOverlay,
  },
  optionLabel: {
    color: colors.textHeading,
    ...textRoles.body,
  },
  optionLabelSelected: {
    color: colors.secondary,
    fontFamily: fonts.semiBold,
  },
});
