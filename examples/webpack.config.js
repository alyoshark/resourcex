const path = require('path');

const { VueLoaderPlugin } = require('vue-loader');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const dir = (...f) => path.join(__dirname, ...f);

const config = {
  mode: 'development',
  entry: dir('src', 'vue', 'main.js'),
  devtool: 'source-map',
  output: { publicPath: '/' },
  resolve: { extensions: ['.js', '.vue'] },
  module: {
    rules: [
      { test: /\.vue$/, loader: 'vue-loader' },
      { test: /\.js$/, loader: 'babel-loader' },
    ],
  },

  plugins: [
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      template: dir('index.html'),
      filename: 'index.html',
      inject: true,
    }),
  ],

  devServer: {
    historyApiFallback: true,
    overlay: { errors: true },
  },
};

module.exports = config;
