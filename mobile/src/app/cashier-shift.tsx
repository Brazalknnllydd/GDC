import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, Store } from 'lucide-react-native';

import { AppButton } from '../components/ui/app-button';
import { SurfaceCard } from '../components/ui/surface-card';
import { colors, fonts, textSizes } from '../constants/theme';
import { spacing } from '../constants/design-system';
import { apiClient } from '../lib/api';
import { clearAuthSession } from '../lib/auth-session';

export default function CashierShiftScreen() {
  const router = useRouter();
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
      } catch (err) {
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
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SurfaceCard style={styles.card}>
          <View style={styles.iconContainer}>
            <Store color={colors.secondary} size={48} strokeWidth={1.5} />
          </View>
          
          <Text style={styles.title}>Open Shift</Text>
          <Text style={styles.subtitle}>
            Please enter the starting cash amount in your drawer to begin processing sales.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>₱</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={openingCash}
              onChangeText={(text) => {
                setOpeningCash(text);
                setError('');
              }}
              autoFocus
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actions}>
            <AppButton
              label="Open Shift"
              onPress={handleOpenShift}
              variant="primary"
              loading={isLoading}
              fullWidth
            />
            <AppButton
              label="Logout"
              onPress={handleLogout}
              variant="secondary"
              fullWidth
              icon={({ color, size }) => <LogOut color={color} size={size} />}
            />
          </View>
        </SurfaceCard>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.secondary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.semiBold,
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
    paddingHorizontal: spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceNeutral,
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    width: '100%',
    height: 64,
    marginBottom: spacing.lg,
  },
  currencySymbol: {
    fontFamily: fonts.semiBold,
    fontSize: 24,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 28,
    color: colors.textStrong,
    height: '100%',
  },
  errorText: {
    color: colors.danger,
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
  },
});
