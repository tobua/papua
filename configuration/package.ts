import { Package } from '../types'
import { options } from '../utility/options'

export const packageJson = () => {
  const pkg: Package = {
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
  }

  return pkg
}
