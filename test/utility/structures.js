export const packageJson = (name, papua = {}, others = {}) => ({
  name: 'package.json',
  json: true,
  contents: {
    name,
    papua,
    ...others,
  },
})

export const indexJavaScript = (contents) => ({
  name: 'index.js',
  contents,
})

export const javaScriptFile = (name, contents = `console.log('empty')`) => ({
  name,
  contents,
})

export const indexTypeScript = (contents) => ({
  name: 'index.ts',
  contents,
})

export const anyFile = (name, contents) => ({
  name,
  contents,
})

export const testJavaScript = (contents = "test('hello', () => {})") => ({
  name: 'test/basic.test.js',
  contents,
})

export const testTypeScript = (contents = "test('hello', () => {})") => ({
  name: 'test/basic.test.ts',
  contents,
})

export const cssStyles = {
  name: 'styles.css',
  contents: `p { color: red; }`,
}

export const pngLogo = {
  name: 'logo.png',
  copy: 'logo.png',
}

export const javaScriptModule = (name, contents) => ({
  name: `node_modules/${name}/index.js`,
  contents,
})

export const gitkeep = {
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
