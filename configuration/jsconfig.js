export const jsconfig = (jsconfigUserOverrides = {}) => {
  const userJSConfig = {
    extends: 'papua/configuration/jsconfig',
  }

  // The local tsconfig in this package will be written and the user config is extending it.
  const packageJSConfig = {
    compilerOptions: {
      baseUrl: '.',
      experimentalDecorators: true,
    },
  }

  Object.assign(userJSConfig, jsconfigUserOverrides)

  return [userJSConfig, packageJSConfig]
}
