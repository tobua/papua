import { existsSync } from 'fs'
import { resolve, join } from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { LocalDependenciesPlugin } from 'synec'
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin'
import { getProjectOptions } from '../utility/options.js'

const options = getProjectOptions()

const root = (folder) => resolve(process.cwd(), folder)

const getHtmlWebpackPluginOptions = () => {
  const htmlOptions = {
    title: 'papua App',
  }

  if (existsSync(join(process.cwd(), './index.html'))) {
    htmlOptions.template = './index.html'
  }

  return htmlOptions
}

const getEntry = () => {
  const polyfills = ['core-js/stable', 'regenerator-runtime/runtime']
  return [...polyfills, ...options.entries]
}

export default (development) => ({
  mode: development ? 'development' : 'production',
  entry: getEntry(),
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: [
              // Plugins for mobx which uses decorators.
              ['@babel/plugin-proposal-decorators', { legacy: true }],
              ['@babel/plugin-proposal-class-properties', { loose: true }],
            ],
          },
        },
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: development ? '[path][name].[ext]' : '[contenthash].[ext]',
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin(getHtmlWebpackPluginOptions()),
    new LocalDependenciesPlugin(),
  ],
  resolve: {
    // To allow absolute imports from root, without tons of ../..
    // and making it easy to copy code and move files around.
    modules: [root('.'), 'node_modules'],
    // Add TypeScript extensions.
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    plugins: [new TsconfigPathsPlugin({ configFile: options.tsconfigPath })],
  },
  performance: {
    hints: false,
  },
})
