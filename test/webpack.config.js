const webpack = require('webpack');
const path = require('path');

const core_config = {
    mode: 'production',
    devtool: 'none',
    entry: {
        bundle: './test/test.js',
    },
    output: {
        path: __dirname + '/',
        filename: '[name].js'
    }
}

module.exports = core_config;