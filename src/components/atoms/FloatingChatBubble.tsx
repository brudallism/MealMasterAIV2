// src/components/atoms/FloatingChatBubble.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FloatingChatBubbleProps {
  onPress?: () => void;
  visible?: boolean;
}

const FloatingChatBubble: React.FC<FloatingChatBubbleProps> = ({
  onPress,
  visible = true,
}) => {
  const [animation] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.spring(animation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [visible, animation]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            {
              scale: animation,
            },
          ],
          opacity: animation,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.bubble}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubble" size={24} color="#FFFFFF" />
        <Text style={styles.bubbleText}>AI</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface FloatingChatBubbleWrapperProps {
  children: React.ReactNode;
  onChatPress?: () => void;
  showBubble?: boolean;
}

export const FloatingChatBubbleWrapper: React.FC<FloatingChatBubbleWrapperProps> = ({
  children,
  onChatPress,
  showBubble = true,
}) => {
  const handleChatPress = () => {
    if (onChatPress) {
      onChatPress();
    } else {
      // Default behavior - could navigate to chat screen
      console.log('Opening AI chat...');
    }
  };

  return (
    <View style={styles.wrapper}>
      {children}
      <FloatingChatBubble
        visible={showBubble}
        onPress={handleChatPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative',
  },
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  bubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    flexDirection: 'column',
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default FloatingChatBubble;