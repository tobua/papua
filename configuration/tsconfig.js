import { options } from '../utility/options.js'

export const tsconfig = (tsconfigUserOverrides = {}) => {
  const userTSConfig = {
    extends: 'papua/configuration/tsconfig',
  }

  // The local tsconfig in this package will be written and the user config is extending it.
  const packageTSConfig = {
    compilerOptions: {
      jsx: 'react',
      esModuleInterop: true,
      outDir: `../../../${options().output}`,
      baseUrl: '../../..',
    },
    files: options().entries.map((entry) => `../../../${entry}`),
    exclude: [`../../../${options().output}`],
    include: ['./global.d.ts'],
  }

  if (options().test) {
    packageTSConfig.include.push('../../../test')
  }

  Object.assign(userTSConfig, tsconfigUserOverrides)

  return [userTSConfig, packageTSConfig]
}
