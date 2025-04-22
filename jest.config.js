export default {
    transform: {
      '^.+\\.js$': 'babel-jest',
    },
    testEnvironment: 'node',
    moduleFileExtensions: ['js', 'json', 'node'],
    transformIgnorePatterns: ['<rootDir>/node_modules/'],
  };
  