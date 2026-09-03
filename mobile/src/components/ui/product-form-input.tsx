import type { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';

import { radius, spacing } from '../../constants/design-system';
import { colors, textRoles, textSizes } from '../../constants/theme';

type ProductFormInputProps = {
  label: string;
  placeholder: string;
  value: string;
  compact?: boolean;
  dense?: boolean;
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
  dense = false,
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
    <View style={[styles.fieldGroup, dense ? styles.fieldGroupDense : undefined]}>
      <Text style={[styles.label, dense ? styles.labelDense : undefined]}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          contentStyle={[
            styles.input,
            compact ? styles.inputCompact : undefined,
            dense ? styles.inputDense : undefined,
            multiline ? styles.inputMultiline : undefined,
            multiline && compact ? styles.inputMultilineCompact : undefined,
            multiline && dense ? styles.inputMultilineDense : undefined,
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
            dense ? styles.inputShellDense : undefined,
            multiline ? styles.inputShellMultiline : undefined,
            multiline && compact ? styles.inputShellMultilineCompact : undefined,
            multiline && dense ? styles.inputShellMultilineDense : undefined,
          ]}
          textAlignVertical={multiline ? 'top' : undefined}
          value={value}
        />
        {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
      </View>
      {errorMessage ? (
        <HelperText style={styles.errorText} type="error" visible>
          {errorMessage}
        </HelperText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  fieldGroupDense: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textHeading,
    ...textRoles.label,
    fontSize: textSizes.small,
    letterSpacing: 1.8,
    marginBottom: spacing.sm,
  },
  labelDense: {
    fontSize: textSizes.small,
    letterSpacing: 2,
    marginBottom: spacing.xs + 2,
  },
  inputShell: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    minHeight: 50,
  },
  inputShellCompact: {
    minHeight: 46,
  },
  inputShellDense: {
    borderRadius: radius.lg,
    minHeight: 48,
  },
  inputWrap: {
    justifyContent: 'center',
  },
  inputShellMultiline: {
    minHeight: 82,
  },
  inputShellMultilineCompact: {
    minHeight: 78,
  },
  inputShellMultilineDense: {
    minHeight: 78,
  },
  input: {
    color: colors.textStrong,
    ...textRoles.body,
    fontSize: textSizes.body,
  },
  inputCompact: {
    fontSize: textSizes.body,
  },
  inputDense: {
    fontSize: textSizes.body,
  },
  inputMultiline: {
    minHeight: 78,
  },
  inputMultilineCompact: {
    minHeight: 74,
  },
  inputMultilineDense: {
    minHeight: 62,
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
