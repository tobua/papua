import { join } from 'path'

// Required for pnpm as modules are nested deeper.
const inModules = (path) => path.includes('node_modules') && process.env.INIT_CWD
// More specific check but above more generic version should work with any package manager.
const packageInModules = (path) =>
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
