import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Check, ChevronDown, Search } from 'lucide-react-native';

import { radius, shadows, spacing } from '../../constants/design-system';
import { colors, fonts, textRoles, textSizes } from '../../constants/theme';
import { useResponsiveLayout } from '../../hooks/use-responsive-layout';

export type AppSelectOption = {
  label: string;
  value: string;
};

type AppSelectProps = {
  options: AppSelectOption[] | string[];
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  value: string;
  onValueChange: (value: string) => void;
  style?: any;
};

export function AppSelect({
  options,
  placeholder = 'Select an option',
  searchable = false,
  searchPlaceholder = 'Search options',
  emptyText = 'No options found.',
  value,
  onValueChange,
  style,
}: AppSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { width } = useWindowDimensions();
  const { isTablet } = useResponsiveLayout();
  const isCompactPhone = width < 430;

  const normalizedOptions: AppSelectOption[] = options.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);
  const cleanSearchQuery = searchQuery.trim().toLowerCase();
  const visibleOptions = cleanSearchQuery
    ? normalizedOptions.filter((opt) =>
        `${opt.label} ${opt.value}`.toLowerCase().includes(cleanSearchQuery)
      )
    : normalizedOptions;

  function closeDropdown() {
    setIsOpen(false);
    setSearchQuery('');
  }

  return (
    <>
      <Pressable
        onPress={() => {
          setSearchQuery('');
          setIsOpen(true);
        }}
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
        onRequestClose={closeDropdown}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdropPressable} onPress={closeDropdown} />
          <View
            style={[
              styles.dropdown,
              isCompactPhone && styles.dropdownCompact,
              isTablet && styles.dropdownTablet,
            ]}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>{placeholder}</Text>
              {searchable ? (
                <View style={styles.searchField}>
                  <Search color={colors.textTertiary} size={17} strokeWidth={2} />
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    clearButtonMode="while-editing"
                    onChangeText={setSearchQuery}
                    placeholder={searchPlaceholder}
                    placeholderTextColor={colors.textTertiary}
                    style={styles.searchInput}
                    value={searchQuery}
                  />
                </View>
              ) : null}
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.optionsList}
            >
              {visibleOptions.length > 0 ? (
                visibleOptions.map((opt) => {
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
                        closeDropdown();
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
                        <View style={styles.optionIconSpacer} />
                      )}
                    </Pressable>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>{emptyText}</Text>
              )}
            </ScrollView>
          </View>
        </View>
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
  backdropPressable: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  dropdown: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    maxHeight: 380,
    width: '100%',
    maxWidth: 400,
    ...shadows.floating,
    overflow: 'hidden',
  },
  dropdownCompact: {
    maxWidth: '100%',
  },
  dropdownTablet: {
    maxWidth: 520,
    maxHeight: 440,
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
  searchField: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.borderMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 42,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    color: colors.textStrong,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    height: '100%',
    minWidth: 0,
    paddingVertical: 0,
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
    flex: 1,
    ...textRoles.body,
  },
  optionLabelSelected: {
    color: colors.secondary,
    fontFamily: fonts.semiBold,
  },
  optionIconSpacer: {
    width: 18,
  },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
});
