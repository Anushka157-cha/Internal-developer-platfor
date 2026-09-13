/** Jest config for backend (e2e) */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: "(\\.|/)(spec|e2e-spec)\\.ts$",
  moduleFileExtensions: ['js', 'json', 'ts'],
  roots: ['<rootDir>/test', '<rootDir>/src'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/modules/auth/**/*.ts',
    'src/modules/services/**/*.ts',
    'src/modules/feature-flags/**/*.ts',
    'src/common/**/*.ts',
    '!src/**/dto/**/*.ts',
    '!src/**/*.module.ts',
  ],
};
