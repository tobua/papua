import { options } from '../utility/options.js'

export const packageJson = () => {
  const pkg = {
    scripts: {
      start: 'papua start',
    },
    type: 'module',
    engines: {
      node: '>= 14',
    },
    prettier: 'papua/configuration/.prettierrc.json',
    eslintConfig: {
      extends: './node_modules/papua/configuration/eslint.cjs',
    },
    stylelint: {
      extends: 'papua/configuration/stylelint.cjs',
    },
  }

  if (options().hasTest) {
    pkg.scripts.test = 'papua test'
    pkg.jest = {
      transform: {},
    }

    if (options().typescript) {
      pkg.jest.transform['^.+\\.tsx?$'] = 'ts-jest'
      pkg.jest.globals = {
        'ts-jest': {
          tsconfig: './node_modules/papua/configuration/tsconfig.json',
        },
      }
    } else {
      pkg.jest.transform['^.+\\.jsx?$'] = [
        'babel-jest',
        { configFile: './node_modules/papua/configuration/.babelrc' },
      ]
    }
  }

  return pkg
}
