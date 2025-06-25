module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-explicit-any': 'off', // Will be removed after initial setup
    '@typescript-eslint/explicit-module-boundary-types': 'off', // Will be removed after initial setup
  },
  env: {
    node: true,
    jest: true,
  },
}; 