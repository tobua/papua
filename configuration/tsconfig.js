import objectAssignDeep from 'object-assign-deep'
import { options } from '../utility/options.js'

export const tsconfig = (tsconfigUserOverrides = {}) => {
  const userTSConfig = {
    extends: 'papua/configuration/tsconfig',
  }

  // The local tsconfig in this package will be written and the user config is extending it.
  const packageTSConfig = {
    compilerOptions: {
      jsx: 'react-jsx',
      esModuleInterop: true,
      outDir: `../../../${options().output}`,
      baseUrl: '../../..',
    },
    files: options().entry.map((entry) => `../../../${entry}`),
    exclude: [`../../../${options().output}`],
    include: ['./global.d.ts'],
  }

  if (options().hasTest) {
    packageTSConfig.include.push('../../../test')
  }

  objectAssignDeep(userTSConfig, tsconfigUserOverrides)

  return [userTSConfig, packageTSConfig]
}
