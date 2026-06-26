import axios from 'axios';
import { useState } from 'react';
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

import { colors, fonts } from '../constants/theme';
import { API_BASE_URL } from '../lib/api';

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
  const [errorMessage, setErrorMessage] = useState('');
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState('');

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

      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username: trimmedUsername,
        password,
      });

      setToken(response.data.token);
      setAuthenticatedUser(response.data.user);
      setPassword('');

      if (response.data.user.role.toLowerCase() === 'admin') {
        router.replace({
          pathname: '/admin',
          params: {
            name: response.data.user.name,
          },
        });
        return;
      }

      router.replace({
        pathname: '/cashier',
        params: {
          name: response.data.user.name,
          userId: String(response.data.user.id),
        },
      });
    } catch (error) {
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
                  placeholderTextColor="#A0A7B4"
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
                  placeholderTextColor="#A0A7B4"
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
                disabled={isSubmitting}
                onPress={handleLogin}
                style={({ pressed }) => [
                  styles.authorizeButton,
                  isSubmitting && styles.authorizeButtonDisabled,
                  pressed && !isSubmitting && styles.authorizeButtonPressed,
                ]}>
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.authorizeText}>AUTHORIZE</Text>
                    <LogIn size={22} color="#FFFFFF" />
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
                <ShieldCheck size={15} color="#3C87F7" />
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
    backgroundColor: '#FBF8F2',
  },
  background: {
    flex: 1,
    backgroundColor: '#FBF8F2',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 28,
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 26,
  },
  logoTile: {
    width: 150,
    height: 150,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    overflow: 'hidden',
    shadowColor: '#0C2546',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    color: '#0C2546',
    fontFamily: fonts.bold,
    fontSize: 34,
    lineHeight: 38,
    marginBottom: 10,
  },
  brandSubtitle: {
    color: '#3F4652',
    fontFamily: fonts.semiBold,
    fontSize: 12,
    letterSpacing: 4,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 640,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderWidth: 1,
    borderColor: '#E6EAF1',
    shadowColor: '#0C2546',
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
    marginBottom: 10,
  },
  cardAccent: {
    width: 8,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#EF4444',
    marginRight: 14,
  },
  cardTitle: {
    color: '#171C24',
    fontFamily: fonts.bold,
    fontSize: 22,
  },
  cardDescription: {
    color: '#4B5563',
    fontFamily: fonts.regular,
    fontSize: 14,
    marginBottom: 28,
  },
  fieldLabel: {
    color: '#353C47',
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  helpText: {
    color: '#1459B8',
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  inputContainer: {
    minHeight: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#C9D2DE',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 15,
    paddingVertical: Platform.select({ web: 14, default: 10 }),
  },
  eyeButton: {
    paddingLeft: 12,
  },
  errorText: {
    color: '#B42318',
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: -6,
    marginBottom: 14,
  },
  successBanner: {
    backgroundColor: '#ECFDF3',
    borderColor: '#ABEFC6',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: -6,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  successTitle: {
    color: '#067647',
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  successMeta: {
    color: '#067647',
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 2,
  },
  authorizeButton: {
    minHeight: 62,
    borderRadius: 16,
    backgroundColor: '#0C2546',
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0C2546',
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
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontSize: 18,
    letterSpacing: 2.2,
    marginRight: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E7EBF0',
    marginVertical: 28,
  },
  supportSection: {
    alignItems: 'center',
    gap: 4,
  },
  supportText: {
    color: '#414A57',
    fontFamily: fonts.regular,
    fontSize: 13,
    textAlign: 'center',
  },
  supportLink: {
    color: '#DC2626',
    fontFamily: fonts.bold,
    fontSize: 15,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    marginBottom: 24,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    color: '#363D47',
    fontFamily: fonts.bold,
    fontSize: 12,
    marginLeft: 8,
  },
  statusToken: {
    color: '#067647',
    fontFamily: fonts.medium,
    fontSize: 12,
    marginLeft: 14,
  },
  footerText: {
    color: '#3F4652',
    fontFamily: fonts.regular,
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 420,
  },
});
