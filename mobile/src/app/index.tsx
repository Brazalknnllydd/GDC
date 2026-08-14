import axios from 'axios';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeClosed, LogIn, Lock, ShieldCheck, User } from 'lucide-react-native';

import { controlHeights, radius, shadows, spacing } from '../constants/design-system';
import { colors, fonts, textSizes } from '../constants/theme';
import { API_BASE_URL } from '../lib/api';
import {
  clearAuthSession,
  getAuthUser,
  restoreAuthSession,
  saveAuthSession,
} from '../lib/auth-session';

type AuthUser = {
  id: number;
  name: string;
  username: string;
  role: string;
};

export default function LoginScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState('');

  useEffect(() => {
    let mounted = true;

    async function resumeSession() {
      try {
        await restoreAuthSession();
        const sessionUser = getAuthUser();

        if (!mounted || !sessionUser) {
          return;
        }

        setAuthenticatedUser(sessionUser);

        if (sessionUser.role.toLowerCase() === 'admin' || sessionUser.role.toLowerCase() === 'owner') {
          router.replace('/admin');
          return;
        }

        router.replace({
          pathname: '/cashier',
          params: { name: sessionUser.name },
        });
      } finally {
        if (mounted) {
          setIsRestoringSession(false);
        }
      }
    }

    resumeSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleLogin = async () => {
    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password) {
      setErrorMessage('Enter both your username and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      setAuthenticatedUser(null);
      setToken('');
      await clearAuthSession();

      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username: trimmedUsername,
        password,
      });

      await saveAuthSession(response.data.token, response.data.user);
      setToken(response.data.token);
      setAuthenticatedUser(response.data.user);
      setPassword('');

      if (response.data.user.role.toLowerCase() === 'admin' || response.data.user.role.toLowerCase() === 'owner') {
        router.replace('/admin');
        return;
      }

      router.replace({
        pathname: '/cashier-shift',
        params: { name: response.data.user.name },
      });
    } catch (error) {
      await clearAuthSession();
      if (axios.isAxiosError(error)) {
        setErrorMessage(error.response?.data?.message ?? 'Unable to sign in right now.');
      } else {
        setErrorMessage('Unable to sign in right now.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.background}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.heroSection}>
              <View style={styles.logoTile}>
                <Image
                  source={require('../../assets/images/logo.jpg')}
                  style={styles.logoImage}
                  resizeMode="cover"
                />
              </View>

              <Text style={styles.brandTitle}>GDC POS</Text>
              <Text style={styles.brandSubtitle}>LOGISTICS MANAGEMENT SYSTEM</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardAccent} />
                <Text style={styles.cardTitle}>Operator Access</Text>
              </View>

              <Text style={styles.cardDescription}>Sign in to the distribution portal.</Text>

              <Text style={styles.fieldLabel}>USER ID</Text>
              <View style={styles.inputContainer}>
                <User size={18} color={colors.muted} />
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  onChangeText={setUsername}
                  placeholder="Enter username"
                  placeholderTextColor={colors.textSubtle}
                  returnKeyType="next"
                  style={styles.input}
                  value={username}
                />
              </View>

              <View style={styles.passwordHeader}>
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <Pressable>
                  <Text style={styles.helpText}>Help?</Text>
                </Pressable>
              </View>

              <View style={styles.inputContainer}>
                <Lock size={18} color={colors.muted} />
                <TextInput
                  editable={!isSubmitting}
                  onChangeText={setPassword}
                  onSubmitEditing={handleLogin}
                  placeholder="Password"
                  placeholderTextColor={colors.textSubtle}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  style={styles.input}
                  value={password}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={isSubmitting}
                  onPress={() => setShowPassword((value) => !value)}
                  style={styles.eyeButton}>
                  {showPassword ? (
                    <Eye size={20} color={colors.muted} />
                  ) : (
                    <EyeClosed size={20} color={colors.muted} />
                  )}
                </Pressable>
              </View>

              {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

              {!!authenticatedUser && (
                <View style={styles.successBanner}>
                  <Text style={styles.successTitle}>Signed in as {authenticatedUser.name}</Text>
                  <Text style={styles.successMeta}>
                    {authenticatedUser.role} | @{authenticatedUser.username}
                  </Text>
                </View>
              )}

              <Pressable
                disabled={isSubmitting || isRestoringSession}
                onPress={handleLogin}
                style={({ pressed }) => [
                  styles.authorizeButton,
                  (isSubmitting || isRestoringSession) && styles.authorizeButtonDisabled,
                  pressed && !isSubmitting && !isRestoringSession && styles.authorizeButtonPressed,
                ]}>
                {isSubmitting || isRestoringSession ? (
                  <ActivityIndicator color={colors.textInverse} />
                ) : (
                  <>
                    <Text style={styles.authorizeText}>AUTHORIZE</Text>
                    <LogIn size={22} color={colors.textInverse} />
                  </>
                )}
              </Pressable>

              <View style={styles.divider} />

              <View style={styles.supportSection}>
                <Text style={styles.supportText}>Internal System. Restricted to GDC</Text>
                <Text style={styles.supportText}>Employees.</Text>
                <Text style={styles.supportLink}>Support Desk</Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <ShieldCheck size={15} color={colors.info} />
                <Text style={styles.statusLabel}>SECURE</Text>
              </View>

              {!!token && <Text style={styles.statusToken}>Token ready</Text>}
            </View>

            <Text style={styles.footerText}>
              Copyright 2024 GDC Global Distribution Corp. All rights reserved.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  background: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.section,
    paddingTop: spacing.lg,
    paddingBottom: spacing.section,
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.section - 2,
  },
  logoTile: {
    width: 150,
    height: 150,
    borderRadius: radius.xxl + 2,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
    overflow: 'hidden',
    ...shadows.floating,
    elevation: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: 34,
    lineHeight: 38,
    marginBottom: spacing.sm + 2,
  },
  brandSubtitle: {
    color: colors.textSoft,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.small,
    letterSpacing: 4,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 640,
    backgroundColor: colors.card,
    borderRadius: 28,
    paddingHorizontal: spacing.xl + 4,
    paddingVertical: spacing.section,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    shadowColor: colors.textDark,
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm + 2,
  },
  cardAccent: {
    width: 8,
    height: 44,
    borderRadius: radius.round,
    backgroundColor: colors.danger,
    marginRight: spacing.md + 2,
  },
  cardTitle: {
    color: colors.textStrong,
    fontFamily: fonts.bold,
    fontSize: textSizes.large,
  },
  cardDescription: {
    color: colors.textSoft,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    marginBottom: spacing.section,
  },
  fieldLabel: {
    color: colors.textHeading,
    fontFamily: fonts.bold,
    fontSize: textSizes.smallCaps,
    letterSpacing: 1.4,
    marginBottom: spacing.sm + 2,
  },
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  helpText: {
    color: colors.info,
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
  },
  inputContainer: {
    minHeight: controlHeights.md + 8,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  input: {
    flex: 1,
    marginLeft: spacing.md,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: textSizes.bodyLarge,
    paddingVertical: Platform.select({ web: 14, default: 10 }),
  },
  eyeButton: {
    paddingLeft: spacing.md,
  },
  errorText: {
    color: colors.dangerStrong,
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
    marginTop: -6,
    marginBottom: spacing.md + 2,
  },
  successBanner: {
    backgroundColor: colors.surfaceSuccessSoft,
    borderColor: colors.borderSuccess,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: -6,
    marginBottom: spacing.md + 2,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
  },
  successTitle: {
    color: colors.successStrong,
    fontFamily: fonts.bold,
    fontSize: textSizes.small + 1,
  },
  successMeta: {
    color: colors.successStrong,
    fontFamily: fonts.regular,
    fontSize: textSizes.small,
    marginTop: 2,
  },
  authorizeButton: {
    minHeight: controlHeights.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.textDark,
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.textDark,
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 6,
  },
  authorizeButtonPressed: {
    opacity: 0.9,
  },
  authorizeButtonDisabled: {
    opacity: 0.75,
  },
  authorizeText: {
    color: colors.textInverse,
    fontFamily: fonts.bold,
    fontSize: textSizes.title,
    letterSpacing: 2.2,
    marginRight: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.dividerStrong,
    marginVertical: spacing.section,
  },
  supportSection: {
    alignItems: 'center',
    gap: 4,
  },
  supportText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: textSizes.small + 1,
    textAlign: 'center',
  },
  supportLink: {
    color: colors.danger,
    fontFamily: fonts.bold,
    fontSize: textSizes.bodyLarge,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.section,
    marginBottom: spacing.xl + 4,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    color: colors.textHeading,
    fontFamily: fonts.bold,
    fontSize: textSizes.small,
    marginLeft: spacing.sm,
  },
  statusToken: {
    color: colors.successStrong,
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
    marginLeft: spacing.md + 2,
  },
  footerText: {
    color: colors.textSoft,
    fontFamily: fonts.regular,
    fontSize: textSizes.smallCaps,
    textAlign: 'center',
    maxWidth: 420,
  },
});
