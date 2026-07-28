module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-screens|react-native-safe-area-context|react-native-gesture-handler)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/assets/'],
};
