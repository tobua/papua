import { options } from '../utility/options'

export const gitignore = () => {
  const entries = ['node_modules', 'package-lock.json']

  if (options().typescript) {
    entries.push('tsconfig.json')
  } else {
    entries.push('jsconfig.json')
  }

  if (!options().source) {
    entries.push(options().output)
  }

  return entries
}
