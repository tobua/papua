import { options } from '../utility/options.js'

export const packageJson = () => {
  const pkg = {
    engines: {
      node: '>= 13.2.0',
    },
    prettier: 'papua/configuration/.prettierrc.json',
    eslintConfig: {
      extends: './node_modules/papua/configuration/eslint.cjs',
    },
    files: [options().output],
  }

  if (options().test || !options().source) {
    pkg.scripts = {}
  }

  if (options().test) {
    pkg.scripts.test = 'papua test'
    pkg.jest = {
      transform: {},
    }

    if (options().typescript) {
      pkg.jest.transform['^.+\\.tsx?$'] = 'ts-jest'
      pkg.jest.globals = {
        'ts-jest': {
          tsConfig: './node_modules/papua/configuration/tsconfig.json',
        },
      }
    } else {
      pkg.jest.transform['^.+\\.jsx?$'] = [
        'babel-jest',
        { configFile: './node_modules/papua/configuration/.babelrc' },
      ]
    }
  }

  if (options().source) {
    pkg.files = ['**/*.js', 'index.d.ts']
    if (options().test) {
      pkg.files.push('!test')
    }
    pkg.main = `${options().entry}`
    // Extensions required for node source code.
    pkg.eslintConfig.rules = {
      'import/extensions': [2, 'always'],
    }
  } else {
    pkg.scripts.start = 'papua start'
    pkg.main = `${options().output}/index.js`
  }

  if (options().entry) {
    pkg.source = options().entry
  }

  return pkg
}
