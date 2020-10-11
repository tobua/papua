import { join } from 'path'

export const getProjectBasePath = () => {
  // CWD during postinstall is in package, otherwise in project.
  const currentWorkingDirectory = process.cwd()

  if (currentWorkingDirectory.includes('node_modules/papua')) {
    return join(currentWorkingDirectory, '../..')
  }

  return currentWorkingDirectory
}