import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Delete } from 'lucide-react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts, textSizes } from '../../constants/theme';

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
            <Delete color={colors.dangerAccent} size={18} strokeWidth={2.1} />
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
    backgroundColor: colors.card,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1.1,
    height: 42,
    justifyContent: 'center',
    transform: [{ scale: 1 }],
    width: '31.3%',
  },
  keyPressed: {
    backgroundColor: colors.surfaceInfo,
    borderColor: colors.borderInfoStrong,
    transform: [{ scale: 0.97 }],
  },
  keyBackspacePressed: {
    backgroundColor: colors.surfaceDangerMuted,
    borderColor: colors.borderDangerSoft,
    transform: [{ scale: 0.97 }],
  },
  keyText: {
    color: colors.textDark,
    fontFamily: fonts.medium,
    fontSize: textSizes.medium,
  },
});
