import { join } from 'path'
import eslint from 'eslint'
import stylelint from 'stylelint'
import { execSync } from 'child_process'
import { log } from '../utility/helper'
import { options } from '../utility/options'

const { ESLint } = eslint
const { lint } = stylelint

export default async () => {
  const configurationPath = join(process.cwd(), 'node_modules/papua/configuration')

  log('formatting files...')

  const configPath = join(configurationPath, '.prettierrc.json')
  const ignorePath = join(configurationPath, '.prettierignore')

  execSync(
    `prettier --write "**/*.{ts,tsx,js,jsx,cjs,mjs}" --config "${configPath}" --ignore-path "${ignorePath}"`,
    { stdio: 'inherit', cwd: process.cwd() },
  )

  console.log('')

  log('linting files...')

  // ESLint
  const linter = new ESLint({
    fix: true,
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.cjs', '.mjs'],
  })
  const eslintResults = await linter.lintFiles('.')
  await ESLint.outputFixes(eslintResults)
  const formatter = await linter.loadFormatter('stylish')
  const resultText = formatter.format(eslintResults)

  if (resultText) {
    console.log(resultText)
  }

  // Stylelint
  const stylelintResults = await lint({
    files: '**/*.{js,jsx,ts,tsx,cjs,mjs}',
    formatter: 'verbose',
    ignorePattern: [options().output],
    customSyntax: 'postcss-styled',
  })

  console.log(stylelintResults.output)
}
