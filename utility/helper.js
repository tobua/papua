import { create } from 'logua'
import getPort from 'get-port'

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

export const isPlugin = (packageContents) =>
  packageContents.main && packageContents.version

export const isTest = typeof jest !== 'undefined'

export const removeLeadingSlash = (path) => path.replace(/^\/*/, '')

export const freePort = async () =>
  getPort({
    port: getPort.makeRange(3000, 3100),
    host: '127.0.0.1',
  })
