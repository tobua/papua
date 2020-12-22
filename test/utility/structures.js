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

const indexTypeScript = (contents) => ({
  name: 'index.ts',
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

const javaScriptModule = (name, contents) => ({
  name: `node_modules/${name}/index.js`,
  contents,
})

const gitkeep = {
  name: '.gitkeep',
}

export const simple = [packageJson('simple')]

export const empty = [gitkeep]

export const gitignore = [packageJson('gitignore'), indexJavaScript('')]

export const typescript = [
  packageJson('typescript'),
  indexTypeScript(`console.log('typescript')`),
]

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
  indexJavaScript(`import 'my-module';`),
  javaScriptModule('my-module', `console.log('hello');`),
]

export const esmodule = [
  packageJson('esmodule'),
  indexJavaScript(`import 'my-module';`),
  javaScriptModule('my-module', `import 'my-imported-module'`),
  javaScriptModule(
    'my-imported-module',
    `export default console.log('hello again')`
  ),
]

export const treeshaking = [
  packageJson('treeshaking'),
  indexJavaScript(`import { hello } from 'my-module'; console.log(hello)`),
  javaScriptModule(
    'my-module',
    `export default 'remove-me'
export const hello = 'keep-me'
export const world = 'remove-me'`
  ),
]
