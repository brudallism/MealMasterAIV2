const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Mock react-native-keyboard-controller for Expo Go compatibility
config.resolver.alias = {
  'react-native-keyboard-controller': require.resolve('./src/utils/keyboard-controller-mock.js'),
};

module.exports = config;