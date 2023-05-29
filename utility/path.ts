import { existsSync, readFileSync } from 'fs'
import { join, relative } from 'path'
import mapWorkspaces from '@npmcli/map-workspaces'
import { findRootSync } from '@manypkg/find-root'
import { isTest } from './test'

// Required for pnpm as modules are nested deeper.
const inModules = (path: string) => path.includes('node_modules') && process.env.INIT_CWD
// More specific check but above more generic version should work with any package manager.
const packageInModules = (path: string) =>
  path.includes('node_modules/papua') || path.includes('node_modules\\papua')

let workspacePath = '.'

export const setWorkspacePath = (currentPath: string) => {
  workspacePath = currentPath
}

export const isWorkspace = () => {
  if (workspacePath !== '.') {
    return true
  }

  const rootDirectory = findRootSync(process.cwd()).rootDir

  if (rootDirectory) {
    let hasWorkSpaces = false
    try {
      // Avoiding full parse of package.json.
      hasWorkSpaces = readFileSync(join(rootDirectory, 'package.json'), 'utf-8').includes(
        '"workspaces":'
      )
    } catch (error) {
      // Ignore
    }
    return hasWorkSpaces
  }

  return false
}

export const getProjectBasePath = () => {
  // CWD during postinstall is in package, otherwise in project.
  const currentWorkingDirectory = process.cwd()

  if (inModules(currentWorkingDirectory)) {
    return join(process.env.INIT_CWD, workspacePath)
  }

  if (packageInModules(currentWorkingDirectory)) {
    return join(currentWorkingDirectory, '../..', workspacePath)
  }

  return join(currentWorkingDirectory, workspacePath)
}

export const getPluginBasePath = () => {
  const currentWorkingDirectory = findRootSync(process.cwd()).rootDir

  if (isTest()) {
    const fixtureConfigPath = join(process.cwd(), 'node_modules/papua')
    if (existsSync(fixtureConfigPath)) {
      return fixtureConfigPath
    }
    return process.env.PAPUA_TEST
  }

  // Required for pnpm as modules are nested deeper.
  if (!inModules(currentWorkingDirectory)) {
    return join(currentWorkingDirectory, 'node_modules/papua')
  }

  if (!packageInModules(currentWorkingDirectory)) {
    return join(currentWorkingDirectory, 'node_modules/papua')
  }

  return currentWorkingDirectory
}

// @manypkg/find-root find root in monorepo.
export const getWorkspacePaths = async () => {
  const basePath = getProjectBasePath()
  const pkg = JSON.parse(readFileSync(join(basePath, 'package.json'), 'utf-8'))

  if (pkg && Array.isArray(pkg.workspaces)) {
    const workspaces = (await mapWorkspaces({
      cwd: basePath,
      pkg,
    })) as Map<string, string>

    const result = []

    Array.from(workspaces.values()).forEach((currentPath) => {
      const { dependencies = {}, devDependencies = {} } = JSON.parse(
        readFileSync(join(currentPath, 'package.json'), 'utf-8')
      )

      const list = Object.keys(dependencies).concat(Object.keys(devDependencies))
      const match = list.includes('papua')

      if (match) {
        result.push(relative(basePath, currentPath))
      }
    })

    return result
  }

  return ['.']
}
