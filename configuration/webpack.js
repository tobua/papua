import { resolve } from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { LocalDependenciesPlugin } from 'synec'

const root = (folder) => resolve(process.cwd(), folder)

export default (development) => ({
  mode: development ? 'development' : 'production',
  entry: ['core-js/stable', 'regenerator-runtime/runtime', './index.js'],
  output: {
    // Make sure assets can be found from nested folders with router active.
    publicPath: '.',
  },
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
              ['@babel/plugin-proposal-decorators', { legacy: true }],
              ['@babel/plugin-proposal-class-properties', { loose: true }],
            ],
          },
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
    }),
    new LocalDependenciesPlugin(),
  ],
  resolve: {
    modules: [root('.'), 'node_modules'],
  },
  performance: {
    hints: false,
  },
})
