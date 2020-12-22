import { readFileSync, writeFileSync } from 'fs'
import { isAbsolute, join } from 'path'

export const readFile = (name, options = {}) => {
  let path = name

  if (!isAbsolute(path)) {
    path = join(process.cwd(), path)
  }

  let content = readFileSync(path, 'utf8')

  if (options.json) {
    content = JSON.parse(content)
  }

  return content
}

export const writeFile = (name, content = '', options = {}) => {
  let path = name

  if (!isAbsolute(path)) {
    path = join(process.cwd(), path)
  }

  let writeContent = content

  if (options.json) {
    writeContent = JSON.stringify(content, null, 2)
  }

  writeFileSync(path, writeContent)
}
