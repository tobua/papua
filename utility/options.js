import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import glob from 'fast-glob'
import objectAssignDeep from 'object-assign-deep'
import { log, cache } from './helper.js'
import { getProjectBasePath } from './path.js'

const emptyFileTemplate = `// This is the entry file for your application.
// If you want to use TypeScript rename it to index.ts
// To enable/disable React adapt the ending .jsx .tsx (React) .js .ts (no React)
// or install React as a dependency.
`
// Default options.
const defaultOptions = {
  output: 'dist',
  typescript: false,
  react: false,
  test: 'test',
  entry: [],
  publicPath: '',
  polyfills: ['core-js/stable', 'regenerator-runtime/runtime'],
  workbox: {},
}

// Get the options for this project, either from the filesystem or explicit configuration.
export const options = cache(() => {
  let packageContents
  const result = objectAssignDeep({}, defaultOptions)

  try {
    const packageJsonPath = join(getProjectBasePath(), 'package.json')
    packageContents = readFileSync(packageJsonPath, 'utf8')
    packageContents = JSON.parse(packageContents)
  } catch (error) {
    log('unable to load package.json', 'error')
  }

  if (typeof packageContents.papua === 'object') {
    // Include project specific overrides
    objectAssignDeep(result, packageContents.papua)

    if (typeof result.entry !== 'string' && !Array.isArray(result.entry)) {
      log(`Invalid 'entry' option provided`, 'error')
    }

    if (typeof result.entry === 'string') {
      result.entry = [result.entry]
    }
  }

  // Add default includes found in file system.
  ;['index', 'src/index'].forEach((entry) =>
    ['js', 'ts', 'jsx', 'tsx'].forEach((extension) => {
      const entryFilePath = `./${entry}.${extension}`

      if (existsSync(join(getProjectBasePath(), entryFilePath))) {
        result.entry.push(entryFilePath)
      }
    })
  )

  let hasJS = false
  let hasTS = false

  result.entry.forEach((entry) => {
    if (/\.tsx?$/.test(entry)) {
      result.typescript = true
      hasTS = true
    }

    if (/\.jsx?$/.test(entry)) {
      hasJS = true
    }

    if (/\.[tj]sx$/.test(entry)) {
      result.react = true
    }
  })

  // Remove duplicates.
  result.entry = [...new Set(result.entry)]

  // Warn if TS and JS mixed (should still work though).
  if (hasJS && hasTS) {
    log(
      'Both JavaScript and TypeScript entries found, we recommend to only use one language per project',
      'warning'
    )
  }

  // Doesn't matter which kind of dependencies the user is using for private projects.
  // Using peerDependencies however makes no sense.
  const reactInstalled =
    Object.keys(packageContents.dependencies || {}).includes('react') ||
    Object.keys(packageContents.devDependencies || {}).includes('react')

  // JSX also works with .js extension and will also be enabled if react dependency is found.
  if (reactInstalled) {
    result.react = true
  } else if (result.react && !reactInstalled) {
    log(`Using JSX but React isn't installed`, 'warning')
  }

  if (result.entry.length === 0) {
    const entryFile = `./index.${result.react ? 'jsx' : 'js'}`
    const entryFilePath = join(getProjectBasePath(), entryFile)

    writeFileSync(entryFilePath, emptyFileTemplate)

    log(`No entry file found, created one in ${entryFilePath}`)

    result.entry = [entryFile]
  }

  const testFiles = glob.sync([`${result.test}/**.test.?s*`], {
    cwd: getProjectBasePath(),
  })

  result.hasTest = testFiles.length > 0

  if (!result.title) {
    result.title = `${packageContents.name || 'papua'} App`
  }

  return result
})
