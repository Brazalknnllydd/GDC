import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, Wallet } from 'lucide-react-native';

import { AppButton } from '../components/ui/app-button';
import { colors, fonts, textSizes } from '../constants/theme';
import { spacing, radius } from '../constants/design-system';
import { apiClient } from '../lib/api';
import { clearAuthSession } from '../lib/auth-session';
import { useResponsiveLayout } from '../hooks/use-responsive-layout';
import { useCashierStore } from '../store/cashier-store';

export default function CashierShiftScreen() {
  const router = useRouter();
  const { isTablet } = useResponsiveLayout();
  const [openingCash, setOpeningCash] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkExistingShift() {
      try {
        const response = await apiClient.get<{ id: number }>('/shifts/current');
        if (response.data) {
          router.replace('/cashier');
        }
      } catch {
        // No active shift, continue to show the screen
      } finally {
        setIsChecking(false);
      }
    }
    checkExistingShift();
  }, [router]);

  const handleOpenShift = async () => {
    const cleanCash = openingCash.replace(/,/g, '');
    const amount = Number(cleanCash);
    if (isNaN(amount) || amount < 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await apiClient.post('/shifts', { openingCash: amount });
      router.replace('/cashier');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to open shift.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await clearAuthSession();
    useCashierStore.getState().resetWorkspace();
    router.replace('/');
  };

  if (isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>GDC POS</Text>
        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut color={colors.danger} size={18} strokeWidth={2.5} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.card, isTablet && styles.cardTablet]}>
          <View style={styles.iconContainer}>
            <Wallet color={colors.secondary} size={44} strokeWidth={1.5} />
          </View>
          
          <Text style={styles.title}>Start Your Shift</Text>
          <Text style={styles.subtitle}>
            Enter the starting cash amount in your drawer to begin processing transactions.
          </Text>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>OPENING CASH</Text>
            <View style={[styles.inputWrapper, error ? styles.inputWrapperError : null]}>
              <Text style={styles.currencySymbol}>₱</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
                value={openingCash}
                onChangeText={(text) => {
                  setOpeningCash(text);
                  setError('');
                }}
                autoFocus
                selectionColor={colors.secondary}
              />
            </View>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <AppButton
              label="Open Shift"
              onPress={handleOpenShift}
              variant="primary"
              loading={isLoading}
              size="lg"
              fullWidth
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundMuted,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: textSizes.title,
    color: colors.secondary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceDanger,
    borderRadius: radius.round,
  },
  logoutText: {
    fontFamily: fonts.bold,
    fontSize: textSizes.small,
    color: colors.danger,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundMuted,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    padding: spacing.xl,
    paddingVertical: 40,
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTablet: {
    maxWidth: 480,
    padding: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceBrandSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: textSizes.titleLarge,
    color: colors.textStrong,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 21,
    paddingHorizontal: spacing.sm,
  },
  inputSection: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontFamily: fonts.semiBold,
    fontSize: textSizes.smallCaps,
    color: colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    width: '100%',
    height: 60,
    borderWidth: 1.5,
    borderColor: colors.borderMuted,
  },
  inputWrapperError: {
    borderColor: colors.danger,
    backgroundColor: colors.surfaceDanger,
  },
  currencySymbol: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.secondary,
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 24,
    color: colors.textStrong,
    height: '100%',
  },
  errorContainer: {
    backgroundColor: colors.surfaceDanger,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    width: '100%',
  },
  errorText: {
    color: colors.danger,
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
  },
});
