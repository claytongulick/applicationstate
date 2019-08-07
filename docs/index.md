# ApplicationState

ApplicationState is a simpler approach to state management. It is not opinionated, aims to be framework agnostic and has no external dependencies. There is a plugin system allowing state to be persised or otherwise processed.

## Why ApplicationState?

- Framework agnostic.
- Simple interface.
- Can work within reactive frameworks.
- Supports all major browsers including IE11 (via polyfills).
- Is extensible via a simple plugin system.
- Is light on external dependencies.

## Pre 1.0 Software

ApplicationState is currently being used in production environments and it's working great. It should not present any problems so long as you stay within the same minor version. However, his software is still under active development and may involve breaking changes between minor versions. Until ApplicationState reaches 1.0 status, you should be prepared to deal with these changes if you choose to jump minor versions.

We guaruntee API consistency within the same minor version. So `v0.2.0` will have the same API as `v0.2.1` and `v0.2.2`. However, `v0.3.0` may or may not introduce an API change. So long as you remain on the same minor version no breaking changes should occur.  If they do please create an [issue](https://github.com/claytongulick/applicationstate/issues).

All that said, we are pretty happy with the API as it stands, and don't have any breaking changes planned or in the works.

## Quick Start

To use it in your project just install with `npm` (or yarn).

    #!sh
    npm install --save applicationstate

Use [webpack](https://webpack.js.org) or similar to include it as a module in your application.

    #!js
    import ApplicationState from "applicationstate";

To use a persistence plugin just import that as well.

    #!js
    import ApplicationState from "applicationstate";
    import { init } from "applicationstate/plugins/indexeddb";
    init(ApplicationState, "database_name")
      .then(() => {})
      .catch(() => {});

Or use the local storage based plugin if you need to support IE11.

    #!js
    import ApplicationState from "applicationstate";
    import { init } from "applicationstate/plugins/localstorage";
    init(ApplicationState, "database_name");

Then get, set, and listen to your heart's content.

    #!js
    ApplicationState.set("app.something", { a: "thing" });
    const a_thing = ApplicationState.get("app.something.a");
    ApplicationState.listen(
      "app.something",
      (new_state, previous_state) => {
        // do amazing things!
      }
    );
