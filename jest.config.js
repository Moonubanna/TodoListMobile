module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  transformIgnorePatterns: [
    "node_modules/(?!(@react-native|react-native|react-native-vector-icons|react-native-linear-gradient|react-native-iphone-x-helper)/)"
  ],
  moduleNameMapper: {
    // Mock image imports with a test file stub
    '\\.(png|jpe?g|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
};