import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { fonts } from '../../constants/theme';

type ProductFormInputProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText?: (value: string) => void;
  keyboardType?: KeyboardTypeOptions;
  rightSlot?: ReactNode;
  editable?: boolean;
};

export function ProductFormInput({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  rightSlot,
  editable = true,
}: ProductFormInputProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputShell}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    marginBottom: 26,
  },
  label: {
    color: '#373C4A',
    fontFamily: fonts.medium,
    fontSize: 16,
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
  input: {
    color: '#14171F',
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 18,
    paddingVertical: 0,
  },
  inputWithSlot: {
    paddingRight: 14,
  },
  rightSlot: {
    marginLeft: 10,
  },
});
