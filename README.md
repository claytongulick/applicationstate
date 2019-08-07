# ApplicationState

Utility for maintaining stateful applications

[![CircleCI](https://circleci.com/gh/blargism/applicationstate/tree/master.svg?style=svg)](https://circleci.com/gh/blargism/applicationstate/tree/master)

## Pre 1.0 Software

ApplicationState is currently being used in production environments and it's working great. It should not present any problems so long as you stay within the same minor version. However, his software is still under active development and may involve breaking changes between minor versions. Until ApplicationState reaches 1.0 status, you should be prepared to deal with these changes if you choose to jump minor versions.

We guaruntee API consistency within the same minor version. So `v0.2.0` will have the same API as `v0.2.1` and `v0.2.2`. However, `v0.3.0` may or may not introduce an API change. So long as you remain on the same minor version no breaking changes should occur.  If they do please create an [issue](https://github.com/claytongulick/applicationstate/issues).

All that said, we are pretty happy with the API as it stands, and don't have any breaking changes planned or in the works.

## About

ApplicationState is a simpler approach to state management. It is not opinionated, aims to be framework agnostic and has no external dependencies. There is a plugin system allowing state to be persised or otherwise processed.

## More Information

For more information see the following

- [Documentation](https://claytongulick.github.io/applicationstate) site.
- [Release Notes](https://claytongulick.github.io/applicationstate/release-notes)
