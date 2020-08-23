import { resolve } from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { LocalDependenciesPlugin } from 'synec'

const root = (folder) => resolve(process.cwd(), folder)

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
