export default {
  scripts: {
    start: 'papua start',
    test: 'papua test',
  },
  prettier: 'papua/configuration/.prettierrc.json',
  eslintConfig: {
    extends: './node_modules/papua/configuration/eslint.cjs',
  },
  jest: {
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
      '^.+\\.jsx?$': [
        'babel-jest',
        { configFile: './node_modules/papua/configuration/.babelrc' },
      ],
    },
    globals: {
      'ts-jest': {
        tsConfig: './node_modules/papua/configuration/tsconfig.json',
      },
    },
  },
}
