import { readFileSync } from 'fs'
import { join, relative } from 'path'
import mapWorkspaces from '@npmcli/map-workspaces'

// Required for pnpm as modules are nested deeper.
const inModules = (path: string) => path.includes('node_modules') && process.env.INIT_CWD
// More specific check but above more generic version should work with any package manager.
const packageInModules = (path: string) =>
  path.includes('node_modules/papua') || path.includes('node_modules\\papua')

export const getProjectBasePath = () => {
  // CWD during postinstall is in package, otherwise in project.
  const currentWorkingDirectory = process.cwd()

  if (inModules(currentWorkingDirectory)) {
    return process.env.INIT_CWD
  }

  if (packageInModules(currentWorkingDirectory)) {
    return join(currentWorkingDirectory, '../..')
  }

  return currentWorkingDirectory
}

export const getPluginBasePath = () => {
  const currentWorkingDirectory = process.cwd()

  if (typeof jest !== 'undefined') {
    return join(currentWorkingDirectory, '../../..')
  }

  // Required for pnpm as modules are nested deeper.
  if (!inModules(currentWorkingDirectory)) {
    return join(process.env.INIT_CWD, 'node_modules/papua')
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

    Array.from(workspaces.values()).forEach((workspacePath) => {
      const { dependencies = {}, devDependencies = {} } = JSON.parse(
        readFileSync(join(workspacePath, 'package.json'), 'utf-8')
      )

      const list = Object.keys(dependencies).concat(Object.keys(devDependencies))
      const match = list.includes('papua')

      if (match) {
        result.push(relative(basePath, workspacePath))
      }
    })

    return result
  }

  return ['.']
}