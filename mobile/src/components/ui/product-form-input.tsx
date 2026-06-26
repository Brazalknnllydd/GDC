import type { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';

import { textRoles, textSizes } from '../../constants/theme';

type ProductFormInputProps = {
  label: string;
  placeholder: string;
  value: string;
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
          contentStyle={[styles.input, multiline ? styles.inputMultiline : undefined]}
          editable={editable}
          error={!!errorMessage}
          keyboardType={keyboardType}
          mode="outlined"
          multiline={multiline}
          numberOfLines={numberOfLines}
          onChangeText={onChangeText}
          outlineColor="#C8CDDD"
          placeholder={placeholder}
          right={rightSlot ? <TextInput.Affix text="" /> : undefined}
          secureTextEntry={secureTextEntry}
          selectionColor="#1A237E"
          style={[styles.inputShell, multiline ? styles.inputShellMultiline : undefined]}
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
    marginBottom: 26,
  },
  label: {
    color: '#373C4A',
    ...textRoles.label,
    fontSize: textSizes.medium,
    letterSpacing: 3,
    marginBottom: 14,
  },
  inputShell: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    minHeight: 86,
  },
  inputWrap: {
    justifyContent: 'center',
  },
  inputShellMultiline: {
    minHeight: 132,
  },
  input: {
    color: '#14171F',
    ...textRoles.body,
    fontSize: 18,
  },
  inputMultiline: {
    minHeight: 96,
  },
  rightSlot: {
    position: 'absolute',
    right: 16,
  },
  errorText: {
    color: '#C62828',
    ...textRoles.label,
    fontSize: 13,
    marginTop: 6,
    minHeight: 22,
    paddingHorizontal: 0,
  },
});
