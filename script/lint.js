import { join } from 'path'
import eslint from 'eslint'
import stylelint from 'stylelint'
import { execSync } from 'child_process'
import { log } from '../utility/helper.js'

const { ESLint } = eslint
const { lint } = stylelint

export default async () => {
  const configurationPath = join(process.cwd(), 'node_modules/papua/configuration')

  log('formatting files...')

  const configPath = join(configurationPath, '.prettierrc.json')
  const ignorePath = join(configurationPath, '.prettierignore')

  execSync(
    `prettier --write '**/*.{ts,tsx,js,jsx}' --config ${configPath} --ignore-path ${ignorePath}`,
    { stdio: 'inherit', cwd: process.cwd() }
  )

  console.log('')

  log('linting files...')

  // ESLint
  const linter = new ESLint({
    fix: true,
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
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
    files: '**/*.{js,jsx,ts,tsx}',
    formatter: 'verbose',
  })

  console.log(stylelintResults.output)
}
