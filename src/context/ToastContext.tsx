import React, { createContext, useContext, useState, useCallback } from 'react';
import { Text, StyleSheet, Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing, typography, useTheme } from '../theme';

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

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const [visible, setVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const hideToast = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
    });
  }, [fadeAnim]);

  const showToast = useCallback(
    (msg: string, msgType: ToastType = 'info') => {
      setMessage(msg);
      setType(msgType);
      setVisible(true);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto hide after 3 seconds
      const timer = setTimeout(() => {
        hideToast();
      }, 3000);

      return () => clearTimeout(timer);
    },
    [fadeAnim, hideToast],
  );

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      default:
        return colors.accent;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {visible && (
        <Animated.View
          accessibilityLiveRegion={type === 'error' ? 'assertive' : 'polite'}
          accessible={false}
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
              bottom: insets.bottom + 20,
              backgroundColor: getBackgroundColor(),
            },
          ]}
        >
          <Pressable
            onPress={hideToast}
            style={({ pressed }) => [pressed && { opacity: 0.92 }]}
            accessibilityRole={type === 'error' ? 'alert' : 'button'}
            accessibilityLabel={
              type === 'error'
                ? message
                : `${message}. Double tap to dismiss.`
            }
          >
            <Text style={styles.text} accessible={false}>
              {message}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    paddingVertical: spacing.m + 2,
    paddingHorizontal: spacing.l,
    borderRadius: radius.l,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999,
  },
  text: {
    ...typography.body,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
  },
});
