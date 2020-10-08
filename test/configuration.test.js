import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import rimraf from 'rimraf'
import { writeGitIgnore } from '../utility/configuration.js'

const CWD = process.cwd()
const cwdSpy = jest.spyOn(process, 'cwd')

test('Generates gitignore with default entries.', () => {
  const fixturePath = join(CWD, 'test/fixture/gitignore')
  const gitignorePath = join(fixturePath, '.gitignore')
  cwdSpy.mockReturnValue(fixturePath)

  rimraf.sync(gitignorePath)

  writeGitIgnore([])

  expect(existsSync(gitignorePath)).toEqual(true)

  const contents = readFileSync(gitignorePath, 'utf8')

  expect(contents).toEqual(
    ['node_modules', 'package-lock.json', 'jsconfig.json', 'dist', ''].join(
      '\r\n'
    )
  )

  rimraf.sync(gitignorePath)
})

test('Generates proper gitignore for typescript.', () => {
  const fixturePath = join(CWD, 'test/fixture/typescript')
  const gitignorePath = join(fixturePath, '.gitignore')
  cwdSpy.mockReturnValue(fixturePath)

  rimraf.sync(gitignorePath)

  writeGitIgnore([])

  expect(existsSync(gitignorePath)).toEqual(true)

  const contents = readFileSync(gitignorePath, 'utf8')

  expect(contents).toEqual(
    ['node_modules', 'package-lock.json', 'tsconfig.json', 'dist', ''].join(
      '\r\n'
    )
  )

  rimraf.sync(gitignorePath)
})
