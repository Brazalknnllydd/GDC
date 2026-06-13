import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

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
}: ProductFormInputProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputShell, errorMessage ? styles.inputShellError : undefined]}>
        <TextInput
          editable={editable}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#737A8D"
          selectionColor="#1A237E"
          style={[styles.input, rightSlot ? styles.inputWithSlot : undefined]}
          value={value}
        />
        {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
      </View>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
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
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#C8CDDD',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 86,
    overflow: 'hidden',
    paddingLeft: 20,
    paddingRight: 12,
  },
  inputShellError: {
    borderColor: '#C62828',
  },
  input: {
    color: '#14171F',
    flex: 1,
    ...textRoles.body,
    fontSize: 18,
    paddingVertical: 0,
  },
  inputWithSlot: {
    paddingRight: 14,
  },
  rightSlot: {
    marginLeft: 10,
  },
  errorText: {
    color: '#C62828',
    ...textRoles.label,
    fontSize: 13,
    marginTop: 10,
  },
});
