export default {
  scripts: {
    start: 'papua start',
    build: 'papua build',
    lint: 'papua lint',
    test: 'papua test',
    update: 'papua update',
  },
  prettier: 'papua/configuration/prettier.js',
  eslintConfig: {
    extends: './node_modules/papua/configuration/eslint.cjs',
  },
  jest: {
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
      '^.+\\.jsx?$': [
        'babel-jest',
        { configFile: './node_modules/padua/configuration/.babelrc' },
      ],
    },
    globals: {
      'ts-jest': {
        tsConfig: './node_modules/padua/configuration/tsconfig.json',
      },
    },
  },
}
