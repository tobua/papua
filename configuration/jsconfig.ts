import { deepmerge } from 'deepmerge-ts'
import { join } from 'path'
import { getPluginBasePath } from '../utility/path'

export const jsconfig = (jsconfigUserOverrides = {}) => {
  let userJSConfig = {
    extends: join(getPluginBasePath(), 'configuration/jsconfig.json'),
  }

  // The local tsconfig in this package will be written and the user config is extending it.
  const packageJSConfig = {
    compilerOptions: {
      jsx: 'react-jsx',
      baseUrl: './../../..',
    },
  }

  userJSConfig = deepmerge(userJSConfig, jsconfigUserOverrides)

  return [userJSConfig, packageJSConfig]
}
