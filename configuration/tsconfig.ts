import { deepmerge } from 'deepmerge-ts'
import { join } from 'path'
import { NormalizedEntry } from '../types'
import { options } from '../utility/options'
import { getPluginBasePath } from '../utility/path'

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
    extends: join(getPluginBasePath(), 'configuration/tsconfig.json'),
  }

  // The local tsconfig in this package will be written and the user config is extending it.
  const packageTSConfig = {
    compilerOptions: {
      skipLibCheck: true,
      jsx: 'react-jsx',
      esModuleInterop: true,
      target: 'esnext',
      module: 'esnext',
      moduleResolution: 'bundler',
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

  userTSConfig = deepmerge(userTSConfig, tsconfigUserOverrides)

  return [userTSConfig, packageTSConfig]
}
