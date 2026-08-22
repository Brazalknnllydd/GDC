import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react-native';
import { colors, fonts, textSizes } from '../../constants/theme';
import { radius, spacing } from '../../constants/design-system';

export type ToastProps = {
  message: string;
  type?: 'success' | 'error' | 'info';
  visible: boolean;
  onHide?: () => void;
  duration?: number;
};

export function AppToast({ message, type = 'success', visible, onHide, duration = 3000 }: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 20,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();

      if (duration > 0) {
        const timer = setTimeout(() => {
          hideToast();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else if (isRendered) {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsRendered(false);
      onHide?.();
    });
  };

  if (!isRendered) return null;

  const toastColor = type === 'success' ? colors.success : type === 'info' ? colors.info : colors.danger;

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]}>
      <View style={[styles.iconWrap, { backgroundColor: `${toastColor}15` }] }>
        {type === 'success' ? (
          <CheckCircle2 color={colors.success} size={18} />
        ) : type === 'info' ? (
          <Info color={colors.info} size={18} />
        ) : (
          <AlertCircle color={colors.danger} size={18} />
        )}
      </View>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
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
