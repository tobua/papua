import eslint from 'eslint'
import stylelint from 'stylelint'
import { execSync } from 'child_process'
import { log } from '../utility/helper.js'

const { ESLint } = eslint
const { lint } = stylelint
const configurationPath = './node_modules/papua/configuration'

export default async () => {
  log('formatting files..')
  execSync(
    `prettier --write '**/*.{ts,tsx,js,jsx}' --config ${configurationPath}/.prettierrc.json --ignore-path ${configurationPath}/.prettierignore`,
    { stdio: 'inherit' }
  )

  console.log('')

  log('linting files..')

  // ESLint
  const linter = new ESLint({
    fix: true,
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  })
  const eslintResults = await linter.lintFiles('.')
  await ESLint.outputFixes(eslintResults)
  const formatter = await linter.loadFormatter('stylish')
  const resultText = formatter.format(eslintResults)

  console.log(resultText)

  // Stylelint
  const stylelintResults = await lint({
    files: '**/*.{js,jsx,ts,tsx}',
    formatter: 'verbose',
  })

  console.log(stylelintResults.output)
}
