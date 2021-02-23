import { join } from 'path'

export const getProjectBasePath = () => {
  // CWD during postinstall is in package, otherwise in project.
  const currentWorkingDirectory = process.cwd()

  if (currentWorkingDirectory.includes('node_modules/papua')) {
    return join(currentWorkingDirectory, '../..')
  }

  return currentWorkingDirectory
}

export const getPluginBasePath = () => {
  const currentWorkingDirectory = process.cwd()

  if (typeof jest !== 'undefined') {
    return join(currentWorkingDirectory, '../../..')
  }

  if (!currentWorkingDirectory.includes('node_modules/papua')) {
    return join(currentWorkingDirectory, 'node_modules/papua')
  }

  return currentWorkingDirectory
}
