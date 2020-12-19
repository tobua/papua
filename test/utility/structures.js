const packageJson = (name) => ({
  name: 'package.json',
  json: true,
  contents: {
    name,
  },
})

const indexJavaScript = {
  name: 'index.js',
  contents: `console.log('test')`,
}

export const build = [packageJson('build'), indexJavaScript]
