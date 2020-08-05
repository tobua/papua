import prettier from 'prettier'

export const formatJson = (packageContents) => {
  return prettier.format(packageContents, {
    // Same config as npm uses for formatting upon install.
    trailingComma: 'es5',
    tabWidth: 2,
    singleQuote: true,
    parser: 'json',
    // Workaround to make sure line break applies for eslintConfig.
    printWidth: 20,
  })
}
