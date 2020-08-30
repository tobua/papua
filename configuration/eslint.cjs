const { existsSync } = require('fs')
const { join } = require('path')

const customRules = {
  // Use named exports to make it easier to find usages.
  'import/prefer-default-export': 0,
  // JSX can also be written in JS files but not in TS (build error).
  'react/jsx-filename-extension': 0,
  // Prop types not required, use typescript for type checking.
  'react/prop-types': 0,
  // No line required between mobx observable properties.
  'lines-between-class-members': 0,
  // Multiple mobx classes per file, especially for lists.
  'max-classes-per-file': 0,
  // Allow spreading props.
  'react/jsx-props-no-spreading': 0,
  // No need to write extensions.
  'import/extensions': 0,
}

const customSettings = {
  // This way the IDE finds files with absolute imports from root, only for JS.
  'import/resolver': {
    node: {
      paths: ['.'],
    },
  },
  'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
}

// Same as in utility/options.js (but cannot be imported as it's a ES module)
const findTSConfig = () => {
  const projectPath = join(process.cwd(), 'tsconfig.json')
  const packagePath = './node_modules/papua/configuration/tsconfig.json'

  if (existsSync(projectPath)) {
    return projectPath
  }

  return packagePath
}

// Needs to be old module.
module.exports = {
  extends: ['airbnb', 'prettier', 'prettier/react', 'prettier/babel'],
  rules: customRules,
  ignorePatterns: ['dist'],
  env: {
    browser: true,
  },
  parser: 'babel-eslint',
  settings: customSettings,
  overrides: [
    {
      // Tests
      files: ['**/*.test.js', '**/*.test.ts'],
      settings: customSettings,
      env: {
        jest: true,
      },
    },
    {
      // TypeScript
      files: ['**/*.ts', '**/*.tsx'],
      extends: [
        'airbnb-typescript',
        'prettier',
        'prettier/react',
        'prettier/@typescript-eslint',
      ],
      rules: customRules,
      settings: customSettings,
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: findTSConfig(),
      },
    },
  ],
}
