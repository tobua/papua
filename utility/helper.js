import { create } from 'logua'

export const log = create('papua', 'blue')

const results = new Map()

// Cache the result of a function with separate method to clear between test runs.
// Only for methods that accept no arguments, but read from the filesystem, which
// isn't expected to change until refresh is called.
export const cache = (method) => () => {
  if (results.has(method)) {
    return results.get(method)
  }
  const result = method()

  results.set(method, result)

  return result
}

export const refresh = () => results.clear()

// Skip modifying the project in case it's being used programmatically by a plugin.
export const isPlugin = (packageContents) =>
  packageContents.main && packageContents.version

export const isTest = (testOption, regularOption) =>
  typeof jest !== 'undefined' ? testOption : regularOption

export const removeLeadingSlash = (path) => path.replace(/^\/*/, '')
