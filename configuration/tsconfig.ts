import merge from 'deepmerge'
import { NormalizedEntry } from '../types'
import { options } from '../utility/options'

const getEntries = (entry: NormalizedEntry) => {
  let entries: string[]

  if (!Array.isArray(entry)) {
    entries = Object.values(entry).reduce((current, result) => result.concat(current), [])
  } else {
    entries = entry
  }

  return entries
}

export const tsconfig = (tsconfigUserOverrides = {}) => {
  let userTSConfig = {
    extends: 'papua/configuration/tsconfig',
  }

  // The local tsconfig in this package will be written and the user config is extending it.
  const packageTSConfig = {
    compilerOptions: {
      jsx: 'react-jsx',
      esModuleInterop: true,
      outDir: `../../../${options().output}`,
      baseUrl: '../../..',
      lib: ['esnext', 'dom'],
    },
    files: getEntries(options().entry).map((entry) => `../../../${entry}`),
    exclude: [`../../../${options().output}`],
    include: ['./global.d.ts'],
  }

  if (options().hasTest) {
    packageTSConfig.include.push('../../../test')
  }

  userTSConfig = merge(userTSConfig, tsconfigUserOverrides, { clone: false })

  return [userTSConfig, packageTSConfig]
}
