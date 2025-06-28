import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/src/index.ts', // Exclude server startup from coverage
    '/src/app.ts', // Exclude app setup from coverage
    '/src/common/middlewares/', // Placeholder, adjust as needed
    '/src/common/utils/', // Placeholder, adjust as needed
  ],
  collectCoverage: true,
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coverageThreshold: {
    global: {
      branches:   95,
      functions:  95,
      lines:      95,
      statements: 95,
    }
  },

};

export default config;
