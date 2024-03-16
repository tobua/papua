import { join, relative, isAbsolute } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import glob from 'fast-glob'
import { deepmerge } from 'deepmerge-ts'
import { log, cache, hasLocalDependencies } from './helper'
import { getProjectBasePath } from './path'
import { Entry, NormalizedEntry, Options, Package } from '../types'

const emptyFileTemplate = `// This is the entry file for your application.
// If you want to use TypeScript rename it to index.ts
// To enable/disable React adapt the ending .jsx .tsx (React) .js .ts (no React)
// or install React as a dependency.
`

// Default options.
const defaultOptions: Options = {
  output: 'dist',
  typescript: false,
  react: false,
  test: 'test',
  entry: [],
  publicPath: '',
  injectManifest: {},
  title: 'papua App',
  hasTest: false,
  html: true,
  icon: true,
  hash: true,
  root: true,
  localDependencies: false,
  sourceMap: false,
  envVariables: [],
}

const normalizePaths = (paths: string[] | string) => {
  let result = paths as string[]

  if (typeof paths === 'string') {
    result = [paths]
  }

  result = result.map((path) =>
    relative(getProjectBasePath(), isAbsolute(path) ? path : join(getProjectBasePath(), path)),
  )

  // Remove duplicates.
  result = [...new Set(result)]

  return result
}

const getEntry = (entry: Entry): NormalizedEntry => {
  if (typeof entry === 'string' || (Array.isArray(entry) && entry.length > 0)) {
    return normalizePaths(entry)
  }

  if (typeof entry === 'object' && Object.keys(entry).length > 0) {
    Object.entries(entry).forEach(([key, currentEntry]) => {
      entry[key] = normalizePaths(currentEntry)
    })

    return entry as NormalizedEntry
  }

  const defaultEntries = []

  // Look for default entries found in file system.
  ;['index', 'src/index'].forEach((currentEntry) =>
    ['js', 'ts', 'jsx', 'tsx'].forEach((extension) => {
      const entryFilePath = `./${currentEntry}.${extension}`

      if (existsSync(join(getProjectBasePath(), entryFilePath))) {
        defaultEntries.push(entryFilePath)
      }
    }),
  )

  return normalizePaths(defaultEntries)
}

const analyzeEntries = (entry: NormalizedEntry) => {
  let entries: string[]

  if (!Array.isArray(entry)) {
    entries = Object.values(entry).reduce((current, result) => result.concat(current), [])
  } else {
    entries = entry
  }

  const features = { javascript: false, typescript: false, react: false }

  entries.forEach((currentEntry) => {
    if (/\.tsx?$/.test(currentEntry)) {
      features.typescript = true
    }

    if (/\.jsx?$/.test(currentEntry)) {
      features.javascript = true
    }

    if (/\.[tj]sx$/.test(currentEntry)) {
      features.react = true
    }
  })

  return features
}

// Get the options for this project, either from the filesystem or explicit configuration.
export const options = cache(() => {
  let packageContents: Package
  let result: Partial<Options> = deepmerge({}, defaultOptions)

  try {
    const packageJsonPath = join(getProjectBasePath(), 'package.json')
    packageContents = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  } catch (error) {
    log('Unable to load package.json', 'error')
  }

  if (typeof packageContents.papua === 'object') {
    // Include project specific overrides
    result = deepmerge(result, packageContents.papua)
  }

  result.localDependencies = hasLocalDependencies(packageContents.localDependencies)

  result.entry = getEntry(result.entry)
  const features = analyzeEntries(result.entry)

  result.typescript = features.typescript

  // Warn if TS and JS mixed (should still work though).
  if (features.javascript && features.typescript) {
    log(
      'Both JavaScript and TypeScript entries found, we recommend to only use one language per project',
      'warning',
    )
  }

  // Doesn't matter which kind of dependencies the user is using for private projects.
  // Using peerDependencies however makes no sense.
  const reactInstalled =
    Object.keys(packageContents.dependencies || {}).includes('react') ||
    Object.keys(packageContents.devDependencies || {}).includes('react')

  // JSX also works with .js extension and will also be enabled if react dependency is found.
  result.react = reactInstalled || features.react

  if (result.react && !reactInstalled) {
    log(`Using JSX but React isn't installed`, 'warning')
  }

  if (Array.isArray(result.entry) && result.entry.length === 0) {
    const entryFile = `./index.${result.react ? 'jsx' : 'js'}`
    const entryFilePath = join(getProjectBasePath(), entryFile)

    writeFileSync(entryFilePath, emptyFileTemplate)

    log(`No entry file found, created one in ${entryFilePath}`)

    result.entry = normalizePaths(entryFile)
  }

  const testFiles = glob.sync([`${result.test}/**.test.?s*`], {
    cwd: getProjectBasePath(),
  })

  result.hasTest = testFiles.length > 0

  if (result.title === 'papua App') {
    result.title = `${packageContents.name || 'papua'} App`
  }

  return result as Options
})
