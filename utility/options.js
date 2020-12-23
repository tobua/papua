import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import glob from 'fast-glob'
import objectAssignDeep from 'object-assign-deep'
import { log, cache } from './helper.js'
import { getProjectBasePath } from './path.js'

const commonEntries = ['index', 'src/index']
const extensions = [
  {
    name: 'js',
    typescript: false,
    react: false,
  },
  {
    name: 'ts',
    typescript: true,
    react: false,
  },
  {
    name: 'jsx',
    typescript: false,
    react: true,
  },
  {
    name: 'tsx',
    typescript: true,
    react: true,
  },
]
const emptyFileTemplate = `
// This is the entry file for your application.
// If you want to use TypeScript rename it to index.ts
// To enable/disable React adapt the ending .jsx .tsx (React) .js .ts (no React)
// or install React as a dependency.
`
// Default options.
const defaultOptions = {
  // Output directory for build files.
  output: 'dist',
  // Is project written in TypeScript.
  typescript: false,
  // Does the project include React.
  react: false,
  // Are there any tests.
  test: false,
  // What's the name of the entry file (defaults: index.[jt]sx?).
  entry: null,
  // Public path where the files are served from.
  publicPath: '',
}

// Get the options for this project, either from the filesystem or explicit configuration.
export const options = cache(() => {
  let packageContents
  const result = defaultOptions

  try {
    packageContents = readFileSync(
      join(getProjectBasePath(), 'package.json'),
      'utf8'
    )
    packageContents = JSON.parse(packageContents)
  } catch (error) {
    log('unable to load package.json', 'error')
  }

  if (typeof packageContents.papua === 'object') {
    // Include project specific overrides
    objectAssignDeep(result, packageContents.papua)
  }

  const { entry } = result

  // Will use single entries array entry for simplicity.
  delete result.entry
  result.entries = []

  if (!entry || (Array.isArray(entry) && entry.length < 1)) {
    commonEntries.forEach((commonEntry) =>
      extensions.forEach((extension) => {
        const entryFilePath = `${commonEntry}.${extension.name}`

        if (existsSync(join(getProjectBasePath(), entryFilePath))) {
          result.entries.push(entryFilePath)
          result.typescript = extension.typescript
          result.react = extensions.react
        }
      })
    )
  } else if (
    typeof entry === 'string' &&
    existsSync(join(getProjectBasePath(), entry))
  ) {
    result.entries.push(entry)
  } else if (Array.isArray(entry)) {
    result.entries = entry
  } else {
    log(`Invalid 'entry' option provided`, 'error')
  }

  const hasJS = result.entries.some((_entry) => /\.jsx?$/g.test(_entry))
  const hasTS = result.entries.some((_entry) => /\.tsx?$/g.test(_entry))

  if (hasJS && hasTS) {
    log(
      'Both JavaScript and TypeScript entries found, please only use one language',
      'error'
    )
  }

  if (
    // Doesn't matter which kind of dependencies the user is using for private projects.
    Object.keys(packageContents.dependencies || {}).includes('react') ||
    Object.keys(packageContents.devDependencies || {}).includes('react')
  ) {
    result.react = true
  }

  if (!result.entries || result.entries.length < 1) {
    const entryFile = `index.${result.react ? 'jsx' : 'js'}`
    const entryFilePath = join(getProjectBasePath(), entryFile)

    writeFileSync(entryFilePath, emptyFileTemplate)

    log(`No entry file found, created one in ${entryFilePath}`)

    result.entries = [entryFile]
  }

  const testFiles = glob.sync(['test/**.test.?s*'], {
    cwd: getProjectBasePath(),
  })

  if (testFiles.length > 0) {
    result.test = true
  }

  if (!result.title) {
    result.title = `${packageContents.name || 'papua'} App`
  }

  return result
})
