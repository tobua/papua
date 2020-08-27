import { existsSync } from 'fs'
import { resolve, join } from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { LocalDependenciesPlugin } from 'synec'

const root = (folder) => resolve(process.cwd(), folder)

const getHtmlWebpackPluginOptions = () => {
  const options = {
    title: 'papua App'
  }

  if (existsSync(join(process.cwd(), './index.html'))) {
    options.template = './index.html'
  }
  
  return options
}

export default (development) => ({
  mode: development ? 'development' : 'production',
  entry: ['core-js/stable', 'regenerator-runtime/runtime', './index.js'],
  module: {
    rules: [
      {
        test: /\.js$/,
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
  },
  performance: {
    hints: false,
  },
})
