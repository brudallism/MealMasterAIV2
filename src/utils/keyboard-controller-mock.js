// Mock for react-native-keyboard-controller to make it compatible with Expo Go
// This provides all the exports that react-native-gifted-chat expects

import React from 'react';
import { NativeEventEmitter } from 'react-native';

// Mock the KeyboardController class
class MockKeyboardController extends NativeEventEmitter {
  constructor() {
    // Pass null to NativeEventEmitter since we don't have a native module
    super(null);
  }

  setInputMode() {
    // Mock implementation - does nothing in Expo Go
    return Promise.resolve();
  }

  setDefaultMode() {
    // Mock implementation - does nothing in Expo Go
    return Promise.resolve();
  }
}

// Mock KeyboardEvents
export const KeyboardEvents = {
  keyboardWillShow: 'keyboardWillShow',
  keyboardDidShow: 'keyboardDidShow',
  keyboardWillHide: 'keyboardWillHide',
  keyboardDidHide: 'keyboardDidHide',
};

// Mock useKeyboard hook
export function useKeyboard() {
  return {
    keyboard: {
      height: 0,
      progress: { value: 0 },
    },
    animated: {
      height: { value: 0 },
      progress: { value: 0 },
    },
  };
}

// Mock KeyboardProvider component
export function KeyboardProvider({ children }) {
  return children;
}

// Mock KeyboardAwareScrollView
export function KeyboardAwareScrollView({ children, ...props }) {
  const { ScrollView } = require('react-native');
  return React.createElement(ScrollView, props, children);
}

// Create and export default instance
const keyboardController = new MockKeyboardController();

// Export everything that the real package would export
export default keyboardController;
export { MockKeyboardController as KeyboardController };

// Mock any other exports that might be needed
export const KeyboardControllerView = function({ children, ...props }) {
  const { View } = require('react-native');
  return React.createElement(View, props, children);
};