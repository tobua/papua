import eslint from 'eslint'

// CommonJS named exports not supported.
const ESLint = eslint.ESLint

export default async () => {
  // TODO Format with Prettier

  // https://eslint.org/docs/developer-guide/nodejs-api
  const eslint = new ESLint({ fix: true })
  const results = await eslint.lintFiles(['**/*.js'])
  await ESLint.outputFixes(results)
  const formatter = await eslint.loadFormatter('stylish')
  const resultText = formatter.format(results)

  console.log(resultText)
}
