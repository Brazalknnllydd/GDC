import type { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';

import { controlHeights, radius, spacing } from '../../constants/design-system';
import { colors, textRoles, textSizes } from '../../constants/theme';

type ProductFormInputProps = {
  label: string;
  placeholder: string;
  value: string;
  compact?: boolean;
  errorMessage?: string;
  onChangeText?: (value: string) => void;
  keyboardType?: KeyboardTypeOptions;
  rightSlot?: ReactNode;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  secureTextEntry?: boolean;
};

export function ProductFormInput({
  label,
  placeholder,
  value,
  compact = false,
  errorMessage,
  onChangeText,
  keyboardType,
  rightSlot,
  editable = true,
  multiline = false,
  numberOfLines,
  secureTextEntry = false,
}: ProductFormInputProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          contentStyle={[
            styles.input,
            compact ? styles.inputCompact : undefined,
            multiline ? styles.inputMultiline : undefined,
            multiline && compact ? styles.inputMultilineCompact : undefined,
          ]}
          editable={editable}
          error={!!errorMessage}
          keyboardType={keyboardType}
          mode="outlined"
          multiline={multiline}
          numberOfLines={numberOfLines}
          onChangeText={onChangeText}
          outlineColor={colors.borderStrong}
          placeholder={placeholder}
          right={rightSlot ? <TextInput.Affix text="" /> : undefined}
          secureTextEntry={secureTextEntry}
          selectionColor={colors.secondary}
          style={[
            styles.inputShell,
            compact ? styles.inputShellCompact : undefined,
            multiline ? styles.inputShellMultiline : undefined,
            multiline && compact ? styles.inputShellMultilineCompact : undefined,
          ]}
          textAlignVertical={multiline ? 'top' : undefined}
          value={value}
        />
        {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
      </View>
      <HelperText style={styles.errorText} type="error" visible={!!errorMessage}>
        {errorMessage || ' '}
      </HelperText>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    marginBottom: spacing.section - 2,
  },
  label: {
    color: colors.textHeading,
    ...textRoles.label,
    fontSize: textSizes.medium,
    letterSpacing: 3,
    marginBottom: spacing.lg - 2,
  },
  inputShell: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    minHeight: controlHeights.input,
  },
  inputShellCompact: {
    minHeight: controlHeights.inputCompact,
  },
  inputWrap: {
    justifyContent: 'center',
  },
  inputShellMultiline: {
    minHeight: controlHeights.inputMultiline,
  },
  inputShellMultilineCompact: {
    minHeight: controlHeights.inputMultilineCompact,
  },
  input: {
    color: colors.textStrong,
    ...textRoles.body,
    fontSize: 18,
  },
  inputCompact: {
    fontSize: 16,
  },
  inputMultiline: {
    minHeight: 96,
  },
  inputMultilineCompact: {
    minHeight: 84,
  },
  rightSlot: {
    position: 'absolute',
    right: spacing.lg,
  },
  errorText: {
    color: colors.dangerStrong,
    ...textRoles.label,
    fontSize: 13,
    marginTop: spacing.sm - 2,
    minHeight: 22,
    paddingHorizontal: 0,
  },
});
