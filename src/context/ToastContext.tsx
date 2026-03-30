import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Easing,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react-native';
import {
  commonStyles,
  radius,
  spacing,
  touchTargetMin,
  useTheme,
} from '../theme';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextData {
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextData | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const TOAST_DURATION_MS = 2600;

const TOAST_ICONS: Record<
  ToastType,
  typeof Info
> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const [visible, setVisible] = useState(false);
  const [fadeAnim] = useState(() => new Animated.Value(0));
  /** Positive = shifted down; anchored at bottom so entering toast slides up into view. */
  const [slideAnim] = useState(() => new Animated.Value(14));
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** True while a toast is shown or dismissing — avoids blanking when messages stack. */
  const bannerActiveRef = useRef(false);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const hideToast = useCallback(() => {
    if (!bannerActiveRef.current) {
      return;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    fadeAnim.stopAnimation();
    slideAnim.stopAnimation();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 10,
        duration: 160,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        bannerActiveRef.current = false;
        setVisible(false);
      }
    });
  }, [fadeAnim, slideAnim]);

  const showToast = useCallback(
    (msg: string, msgType: ToastType = 'info') => {
      fadeAnim.stopAnimation();
      slideAnim.stopAnimation();

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      setMessage(msg);
      setType(msgType);

      if (!bannerActiveRef.current) {
        bannerActiveRef.current = true;
        fadeAnim.setValue(0);
        slideAnim.setValue(14);
        setVisible(true);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        fadeAnim.setValue(1);
        slideAnim.setValue(0);
        Animated.sequence([
          Animated.timing(slideAnim, {
            toValue: 4,
            duration: 55,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 8,
            tension: 140,
            useNativeDriver: true,
          }),
        ]).start();
      }

      hideTimeoutRef.current = setTimeout(() => {
        hideToast();
      }, TOAST_DURATION_MS);
    },
    [fadeAnim, slideAnim, hideToast],
  );

  const accentColor =
    type === 'success'
      ? colors.success
      : type === 'error'
        ? colors.error
        : type === 'warning'
          ? colors.warning
          : colors.accent;

  const Icon = TOAST_ICONS[type];

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {visible && (
        <Animated.View
          accessibilityLiveRegion={type === 'error' ? 'assertive' : 'polite'}
          accessible={false}
          pointerEvents="box-none"
          style={[
            styles.viewport,
            {
              bottom: insets.bottom + spacing.m,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Pressable
            onPress={hideToast}
            style={({ pressed }) => [
              styles.banner,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.94 : 1,
              },
              commonStyles.shadowSubtle,
              Platform.OS === 'android' && styles.bannerAndroid,
            ]}
            accessibilityRole={type === 'error' ? 'alert' : 'button'}
            accessibilityLabel={
              type === 'error'
                ? message
                : `${message}. Double tap to dismiss.`
            }
          >
            <Icon
              size={18}
              color={accentColor}
              strokeWidth={2.25}
              style={styles.icon}
            />
            <Text
              style={[styles.message, { color: colors.textPrimary }]}
              numberOfLines={4}
              accessible={false}
            >
              {message}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  viewport: {
    position: 'absolute',
    left: spacing.m,
    right: spacing.m,
    zIndex: 9999,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.m,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    minHeight: touchTargetMin,
    paddingVertical: spacing.s + 2,
    paddingRight: spacing.m,
  },
  bannerAndroid: {
    elevation: 3,
  },
  icon: {
    marginLeft: spacing.m,
    marginTop: spacing.xs / 2,
  },
  message: {
    flex: 1,
    marginLeft: spacing.s,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.05,
    lineHeight: 20,
  },
});
