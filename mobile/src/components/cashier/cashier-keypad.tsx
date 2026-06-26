import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Delete } from 'lucide-react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts } from '../../constants/theme';

type CashierKeypadProps = {
  onBackspace: () => void;
  onKeyPress: (value: string) => void;
};

const keypadRows = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'backspace'],
] as const;

export function CashierKeypad({ onBackspace, onKeyPress }: CashierKeypadProps) {
  return (
    <View style={styles.grid}>
      {keypadRows.flat().map((keyValue) => (
        <Pressable
          key={keyValue}
          onPress={() => (keyValue === 'backspace' ? onBackspace() : onKeyPress(keyValue))}
          style={({ pressed }) => [
            styles.key,
            pressed && (keyValue === 'backspace' ? styles.keyBackspacePressed : styles.keyPressed),
          ]}>
          {keyValue === 'backspace' ? (
            <Delete color="#D22D2D" size={18} strokeWidth={2.1} />
          ) : (
            <Text style={styles.keyText}>{keyValue}</Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  key: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D8DDEB',
    borderRadius: radius.md,
    borderWidth: 1.1,
    height: 42,
    justifyContent: 'center',
    transform: [{ scale: 1 }],
    width: '31.3%',
  },
  keyPressed: {
    backgroundColor: '#EEF2FF',
    borderColor: '#B9C4F4',
    transform: [{ scale: 0.97 }],
  },
  keyBackspacePressed: {
    backgroundColor: '#FDEEEE',
    borderColor: '#F2B8B5',
    transform: [{ scale: 0.97 }],
  },
  keyText: {
    color: '#202636',
    fontFamily: fonts.medium,
    fontSize: 16,
  },
});
