import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Eye, EyeOff } from 'lucide-react-native';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { supabase } from '../../../api/supabase';
import { spacing, typography, useTheme } from '../../../theme';
import { useToast } from '../../../context/ToastContext';

export const SignUpScreen = ({ navigation }: any) => {
  const { showToast } = useToast();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
    } else {
      showToast('Email registered successfully. Please login.', 'success');
      navigation.goBack();
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Create Account.
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign up to get started
          </Text>
        </View>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          error={error && !email ? 'Required' : ''}
        />

        <View style={styles.passwordContainer}>
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!isPasswordVisible}
            error={error && !password ? 'Required' : ''}
            style={styles.passwordInput}
          />
          <Pressable
            style={({ pressed }) => [
              styles.eyeIcon,
              pressed && { opacity: 0.55 },
            ]}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            accessibilityRole="button"
            accessibilityLabel={
              isPasswordVisible ? 'Hide password' : 'Show password'
            }
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            {isPasswordVisible ? (
              <EyeOff size={22} color={colors.textSecondary} strokeWidth={2} />
            ) : (
              <Eye size={22} color={colors.textSecondary} strokeWidth={2} />
            )}
          </Pressable>
        </View>

        {error ? (
          <Text
            style={[styles.errorBanner, { color: colors.error }]}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {error}
          </Text>
        ) : null}

        <View style={styles.spacer} />

        <Button
          title="Sign Up"
          onPress={handleSignUp}
          loading={loading}
          accessibilityHint="Creates your account with the email and password above"
        />

        <Pressable
          style={({ pressed }) => [styles.footer, pressed && { opacity: 0.65 }]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Sign in. Navigates back to sign in."
        >
          <Text style={[styles.footerText, { color: colors.textSecondary }]} accessible={false}>
            Already have an account?{' '}
            <Text style={[styles.link, { color: colors.accent }]} accessible={false}>
              Sign In
            </Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.title1,
    marginBottom: spacing.s,
  },
  subtitle: {
    ...typography.body,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50, // Space for eye icon
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 42, // Adjusted for label alignment
  },
  spacer: {
    height: spacing.l,
  },
  errorBanner: {
    ...typography.caption,
    marginTop: spacing.s,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    ...typography.body,
  },
  link: {
    fontWeight: '600',
  },
});
