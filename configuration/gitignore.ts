import { options } from '../utility/options'

export const gitignore = (gitIgnoreUserOverrides: string[] = []) => {
  let entries = ['node_modules', 'package-lock.json']

  if (options().typescript) {
    entries.push('tsconfig.json')
  } else {
    entries.push('jsconfig.json')
  }

  entries.push(options().output)

  if (gitIgnoreUserOverrides.length) {
    entries = entries.concat(gitIgnoreUserOverrides)
  }

  return entries
}
