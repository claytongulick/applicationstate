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
    },
    module: {
        rules: [{
            test: /\.m?js/,
            exclude: /(node_modules|bower_components)/,
            use: {
                loader: "babel-loader",
                options: {
                    presets: [['@babel/preset-env', { useBuiltIns: "entry" }]]
                }
            }
        }]
    }
}

module.exports = core_config;