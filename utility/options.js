import { join } from 'path'
import { readFileSync, existsSync } from 'fs'
import log from 'logua'

let optionsCache

// Get the options for this project, either from the filesystem or explicit configuration.
export const getProjectOptions = () => {
  if (optionsCache) {
    return optionsCache
  }

  const packageJsonPath = join(process.cwd(), 'package.json')

  let packageJson = {}

  try {
    packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  } catch (error) {
    log('package.json not found or not readable', 'error')
  }

  const options = packageJson.papua || {}

  // Entries

  let entries = []

  if (options.entry) {
    if (typeof options.entry === 'string') {
      entries.push(options.entry)
    }

    if (typeof options.entry !== 'string' && Array.isArray(options.entry)) {
      entries = options.entry
    }

    if (entries.length < 1) {
      log('Please provide at least one entry', 'error')
    }
  }

  if (entries.length === 0) {
    const defaultEntries = [
      './index.js',
      './index.jsx',
      './index.ts',
      './index.tsx',
    ]

    defaultEntries.forEach((entry) => {
      if (existsSync(join(process.cwd(), entry))) {
        entries.push(entry)
      }
    })
  }

  if (entries.length === 0) {
    log(
      'No entry file found, please add index.js, index.ts or configure the entry file in package.json',
      'error'
    )
  }

  delete options.entry

  options.entries = entries

  // JS / TS

  console.log(entries)

  options.js = entries.some((entry) => /\.jsx?$/g.test(entry))
  options.ts = entries.some((entry) => /\.tsx?$/g.test(entry))

  if (options.js && options.ts) {
    log(
      'Both JavaScript and TypeScript entries found, please only use one',
      'error'
    )
  }

  optionsCache = options

  return options
}
