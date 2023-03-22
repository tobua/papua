export interface Package {
  name?: string
  version?: string
  papua?: Object
  dependencies?: Object
  peerDependencies?: Object
  scripts?: {
    start?: string
    build?: string
    test?: string
  }
  type: 'module'
  main?: string
  engines: {
    node?: string
  }
  prettier: string
  eslintConfig?: {
    extends?: string
  }
  stylelint?: {
    extends?: string
  }
}

export interface Options {
  test: false | string
  entry: string[]
  output: string
  pkg: Package
  tsconfig?: Object
  gitignore?: string[]
  hash: string
}
