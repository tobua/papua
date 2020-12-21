const packageJson = (name) => ({
  name: 'package.json',
  json: true,
  contents: {
    name,
  },
})

const indexJavaScript = (contents) => ({
  name: 'index.js',
  contents,
})

const cssStyles = {
  name: 'styles.css',
  contents: `p { color: red; }`,
}

const pngLogo = {
  name: 'logo.png',
  copy: 'logo.png',
}

const myModule = (contents) => ({
  name: 'node_modules/my-module/index.js',
  contents,
})

export const build = [
  packageJson('build'),
  indexJavaScript(`console.log('test')`),
]

export const hash = [
  packageJson('hash'),
  indexJavaScript(`import './styles.css';
  import './logo.png';
  
  console.log('test')`),
  cssStyles,
  pngLogo,
]

export const module = [
  packageJson('module'),
  myModule(`console.log('hello');`),
  indexJavaScript(`import 'my-module';`),
]
