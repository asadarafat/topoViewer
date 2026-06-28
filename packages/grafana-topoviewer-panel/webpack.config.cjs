const path = require('node:path');

const packageRoot = __dirname;
const pluginId = 'asadarafat-topoviewer-panel';

module.exports = {
  mode: 'production',
  context: packageRoot,
  entry: './src/module.ts',
  devtool: 'source-map',
  externals: [
    '@grafana/data',
    '@grafana/runtime',
    'react',
    'react-dom',
    'react/jsx-runtime'
  ],
  module: {
    rules: [
      {
        test: /\.[tj]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              target: 'es2018',
              parser: {
                syntax: 'typescript',
                tsx: true
              },
              transform: {
                react: {
                  runtime: 'automatic'
                }
              }
            }
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false
        }
      }
    ]
  },
  optimization: {
    splitChunks: false,
    runtimeChunk: false
  },
  output: {
    clean: true,
    filename: 'module.js',
    library: {
      type: 'amd'
    },
    path: path.join(packageRoot, 'dist'),
    publicPath: `public/plugins/${pluginId}/`,
    uniqueName: pluginId
  },
  performance: {
    hints: false
  },
  stats: 'errors-warnings',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs']
  }
};
