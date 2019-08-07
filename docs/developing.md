# Developing ApplicationState

Currently a small group of developers is working on ApplicationState, but contributions from the wider community are welcomed. To get started check out the [Github issues page](https://github.com/claytongulick/applicationstate/issues) for issues you can help out with.

## Getting Started with Development

To get started with enhancing and developing on ApplicationState, just fork the repo in [Github](https://github.com/claytongulick/applicationstate) and clone from that.

```
git clone https://github.com/<your username>/applicationstate.git
```

We know many of you use `yarn`, and that's cool, but we use `npm` and prefer not to have yarn and npm package lock files in the repo. Fair warning, we will probably reject a pull request with yarn lock files present, so please use `npm` to install your dependencies.

```
npm install
```

Once you have added your new feature or bug fix, just submit a pull request through Github. However, take a few seconds to look at our requirements for contributions below.

## Hacking on ApplicationState

To start directly working on ApplicationState and the default plugins you can use (and add to) our test suite. There are two choices for running tests.

### Running Tests in the Browser

This is probably the best option for doing development on ApplicationState. It allows you to test in multiple browsers and does live updates when files change.

Since this module is designed for the browser and designed to be run as a module, we use the webpack to create a testing environment run in the browser. This is accomplished through [webpack-serve](https://github.com/webpack-contrib/webpack-serve). Follow these steps to get it running.

```
// install development dependencies
npm install

// run the webpack server and open the tests in default browser
npm run dev

// stop the server with ctrl-c
```

Unlike most approaches to testing, the webpack-server keeps going. This enables you to update both the library and unit tests and see instant updates durring development. Of course the down side to that is you need to put in the momentous effort to `ctrl-c` to stop the server once you are done.

### Running Tests with Karma

To enable us to run our tests with our CI/CD tool [CircleCI](https://circleci.com/) we also use [Karma](http://karma-runner.github.io/4.0/index.html). These tests are run in headless Chrome. This means that they can run in the command line so long as Chrome is installed.

Running the tests is simple:

```
npm test
```

## Contributions

We encourage contributions, but ask that several things be in place.

**We would like signed commits.**

Sure, it's a bit heavy handed, but it helps us know that you are who you say you are.

**Documentation should come with code changes.**

The documentation should be updated for:

- New features.
- Updated features.
- Changes in the API.
- Potentially even with bug fixes.

We will reject pull requests that don't have documentation updates and should. Documentation is annoying to write, but it makes the world better. Let's all do our part.
