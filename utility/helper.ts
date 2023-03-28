import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { create } from 'logua'
import formatPackageJson from 'pakag'
import getPort, { portNumbers } from 'get-port'
import merge from 'deepmerge'
import { getProjectBasePath } from './path'
import { Package } from '../types'

export const log = create('papua', 'blue')

const results = new Map()

// Cache the result of a function with separate method to clear between test runs.
// Only for methods that accept no arguments, but read from the filesystem, which
// isn't expected to change until refresh is called.
export const cache =
  <T>(method: () => T): (() => T) =>
  () => {
    if (results.has(method)) {
      const cached = results.get(method)
      // eslint-disable-next-line no-underscore-dangle
      cached.__cached = true
      return cached
    }
    const result = method()

    results.set(method, result)

    return result
  }

export const refresh = () => results.clear()

export const isPlugin = (packageContents: Package) =>
  packageContents.main && packageContents.version

export const isTest = typeof jest !== 'undefined'

export const removeLeadingSlash = (path) => path.replace(/^\/*/, '')

export const freePort = async () => getPort({ port: portNumbers(3000, 3100) })

export const editPackageJson = (edits = {}) => {
  const packageJsonPath = join(getProjectBasePath(), 'package.json')
  let packageContents = JSON.parse(readFileSync(packageJsonPath, 'utf8'))

  packageContents = merge(packageContents, edits, { clone: false })

  const formattedContents = formatPackageJson(JSON.stringify(packageContents))

  writeFileSync(packageJsonPath, formattedContents)
}

export const getConfigurationFilePath = (filename: string) =>
  join(getProjectBasePath(), `./node_modules/papua/configuration/${filename}`)
