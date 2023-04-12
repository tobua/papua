import merge from 'deepmerge'
import { join } from 'path'
import { getProjectBasePath } from '../utility/path'

export const jsconfig = (jsconfigUserOverrides = {}) => {
  let userJSConfig = {
    extends: join(getProjectBasePath(), 'node_modules/papua/configuration/jsconfig.json'),
  }

  // The local tsconfig in this package will be written and the user config is extending it.
  const packageJSConfig = {
    compilerOptions: {
      jsx: 'react-jsx',
      baseUrl: './../../..',
    },
  }

  userJSConfig = merge(userJSConfig, jsconfigUserOverrides, { clone: false })

  return [userJSConfig, packageJSConfig]
}
