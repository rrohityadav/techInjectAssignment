// eslint.config.js (CommonJS)
const globals = require('globals');
const eslintJs = require('@eslint/js');
const tseslint = require('typescript-eslint');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = tseslint.config(
  // 1. Global ignores
  {
    ignores: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        '.nyc_output/**',
        'prisma/generated/**',
        '.env*' , // Ignore .env and .env.*
        '*.log',
        'package-lock.json',
        // Explicitly ignore JS config files from global type-aware checks
        'eslint.config.js',
        'jest.config.ts', // This is a TS file but a config, handle separately if linted
        '.eslintrc.cjs', // In case it reappears or is cached
    ],
  },

  // 2. Base ESLint recommended rules for all linted files (JS and TS)
  eslintJs.configs.recommended,

  // 3. TypeScript-specific configurations (Type-Aware)
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'], // IMPORTANT: Apply only to .ts files in src and tests
    extends: tseslint.configs.recommendedTypeChecked, // Base for type-aware rules
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // Your existing custom rule overrides:
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // Relaxations for common strict rules from recommendedTypeChecked
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',

      // Fix for reported issue: require-await in route files
      // If these functions are async due to Fastify plugin style rather than actual await usage:
      '@typescript-eslint/require-await': 'warn', // Lowered to warn, or could be 'off' if always async
    },
  },
  
  // 4. Configuration for JavaScript files (e.g., eslint.config.js itself if needed, or other JS utils)
  // This block ensures JS files are linted but *not* with type-aware rules.
  {
    files: ['eslint.config.js', 'jest.config.ts'], // Add other JS/TS config files if they exist and need linting
    extends: [tseslint.configs.eslintRecommended], // Basic ESLint rules for JS/TS syntax
    rules: {
        '@typescript-eslint/no-var-requires': 'off', // Allow require() in CJS config files
        'no-undef': 'off' // Allow __dirname in CJS config files without specific env
    }
  },

  // 5. Global environment settings (applies to files matched by default or explicitly)
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },

  // 6. Prettier plugin and config (must be last to override styling rules)
  eslintPluginPrettierRecommended
); 