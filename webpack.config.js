const path = require('path');

let mode = 'development';

let devServer = {
  headers: {
    'Access-Control-Allow-Origin': '*'
  },
};

let output = path.resolve(__dirname, 'static');

module.exports = {
  entry: './src/main.tsx',
  output: {
    filename: 'main.js',
    path: output
  },
  devServer: {
    ...devServer,
    contentBase: output,
  },
  mode: mode,
  name: 'ld42',
  module: {
    rules: [{
      test: /\.tsx?$/,
      use: 'ts-loader',
      exclude: /node_modules/
    }]
  },
  devtool: 'inline-source-map',
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    modules: [ 'lib', 'node_modules' ]
  }
};

