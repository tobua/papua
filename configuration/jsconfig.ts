import merge from 'deepmerge'

export const jsconfig = (jsconfigUserOverrides = {}) => {
  const userJSConfig = {
    extends: 'papua/configuration/jsconfig',
  }

  // The local tsconfig in this package will be written and the user config is extending it.
  const packageJSConfig = {
    compilerOptions: {
      jsx: 'react-jsx',
      baseUrl: './../../..',
    },
  }

  merge(userJSConfig, jsconfigUserOverrides, { clone: false })

  return [userJSConfig, packageJSConfig]
}
