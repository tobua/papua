module.exports = {
  extends: ['airbnb', 'prettier', 'prettier/react', 'prettier/babel'],
  rules: {
    'import/prefer-default-export': 0,
    'react/jsx-filename-extension': 0,
    'react/prop-types': 0,
    'lines-between-class-members': 0,
    'max-classes-per-file': 0,
    'react/jsx-props-no-spreading': 0,
  },
  ignorePatterns: ['dist'],
  env: {
    browser: true,
  },
  parser: 'babel-eslint',
  settings: {
    'import/resolver': {
      node: {
        paths: ['.'],
      },
    },
  },
}
