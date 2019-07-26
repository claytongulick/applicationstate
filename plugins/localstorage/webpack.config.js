const webpack = require('webpack');
const path = require('path');

const core_config = {
  mode: 'production',
  devtool: 'none',
  entry: {
    bundle: './index.js',
  },
  output: {
    path: path.normalize(__dirname + '/../../dist/'),
    filename: 'applicationstate-plugin-localstorage.js'
  }
}

module.exports = core_config;