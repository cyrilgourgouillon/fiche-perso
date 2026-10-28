module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    requireConfigFile: false,
    babelOptions: {
      plugins: [['@babel/plugin-syntax-typescript', {
        allExtensions: true,
        isTSX: true,
      }]],
    },
  },
  extends: [
    'airbnb',
    'airbnb/hooks',
  ],
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: true,
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  rules: {
    'import/extensions': ['error', 'ignorePackages', {
      js: 'never',
      jsx: 'never',
      ts: 'never',
      tsx: 'never',
    }],
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'max-len': 'off',
    'import/prefer-default-export': 'off',
    'react/jsx-props-no-spreading': 'off',
    'react/no-array-index-key': 'off',
    'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    'no-restricted-syntax': ['error',
      {
        selector: 'ForInStatement',
        message: 'for...in loops iterate over the prototype chain.',
      },
      {
        selector: 'WithStatement',
        message: 'with is disallowed in strict mode.',
      },
    ],
    'jsx-a11y/label-has-associated-control': ['error', {
      controlComponents: ['Checkbox', 'TextField', 'TextAreaField', 'SelectField', 'CombatIncludeCheckbox'],
    }],
  },
  overrides: [
    {
      files: ['**/*.{ts,tsx}'],
      rules: {
        'no-undef': 'off',
        'no-unused-vars': 'off',
        'react/jsx-filename-extension': ['error', {
          extensions: ['.tsx'],
        }],
        'react/require-default-props': 'off',
      },
    },
  ],
};
