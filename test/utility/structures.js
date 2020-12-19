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

const indexJavaScriptImports = {
  name: 'index.js',
  contents: `import './styles.css';
import './logo.png';

console.log('test')`,
}

const cssStyles = {
  name: 'styles.css',
  contents: `p { color: red; }`,
}

const pngLogo = {
  name: 'logo.png',
  copy: 'logo.png',
}

export const build = [packageJson('build'), indexJavaScript]

export const hash = [
  packageJson('hash'),
  indexJavaScriptImports,
  cssStyles,
  pngLogo,
]
