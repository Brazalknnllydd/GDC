import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts, textSizes } from '../../constants/theme';

export type ToastProps = {
  message: string;
  type?: 'success' | 'error' | 'info';
  visible: boolean;
};

export function AppToast({ message, type = 'success', visible }: ToastProps) {
  if (!visible) {
    return null;
  }

  const toastColor = type === 'success' ? colors.success : type === 'info' ? colors.info : colors.danger;

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: `${toastColor}15` }]}>
        {type === 'success' ? (
          <CheckCircle2 color={colors.success} size={18} />
        ) : type === 'info' ? (
          <Info color={colors.info} size={18} />
        ) : (
          <AlertCircle color={colors.danger} size={18} />
        )}
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingRight: spacing.lg,
    paddingLeft: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  iconWrap: {
    padding: 6,
    borderRadius: radius.round,
  },
  message: {
    fontFamily: fonts.medium,
    fontSize: textSizes.body,
    color: colors.textStrong,
  },
});
