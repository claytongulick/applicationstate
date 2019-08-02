module.exports = function (config) {
  config.set({
    frameworks: ['mocha', 'chai'],
    files: ['test/test.js'],
    reporters: ['progress'],
    port: 9876,  // karma web server port
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['ChromeHeadless'],
    autoWatch: false,
    // singleRun: false, // Karma captures browsers, runs the tests and exits
    concurrency: Infinity,
    preprocessors: {
      "test/test.js": ["webpack"]
    },
    webpack: {
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
  })
}