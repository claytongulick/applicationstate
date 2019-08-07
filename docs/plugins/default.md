# Default Plugins

At this time there are two storage plugins.
One using Indexeddb, which is preferred for evergreen browsers.
The other provides storage via localStorage, and is suitable for use with IE11.

In both plugins it stores just the string reference and scalar values.

## Indexeddb Plugin

The indexeddb plugin provides a robust storage option for loading and saving the state tree.
It is the more performant of the two.

### Usage

Initializing the plugin is simple, just do the following.

```javascript
import ApplicationState from "applicationstate";
import { init } from "applicationstate/plugins/indexeddb";

init(ApplicationState, "db_name").then(<start app here>).catch(<handle errors>);
```

The `init` function takes the ApplicationState singleton and the database name as an argument.
We are passing in ApplicationState to support the future goal of application state supporting sub-trees in it's state.

Reads and writes to the ApplicationState state tree are instant, but the writes to the actual indexeddb database are asynchronous.
This means you can treat ApplicationState as synchronous in it's writes, without worrying about I/O blocking for the write to indexeddb.

Note, this plugin uses the `Dexie` package to interact with indexeddb.

## Local Storage Plugin

The local storage solution is overall less performant, but is fully supported by IE11.

### Usage

Initializing the plugin is even simpler, just do the following.

```javascript
import ApplicationState from "applicationstate";
import { init } from "applicationstate/plugins/indexeddb";

init(ApplicationState, "db_name");
```

Note that this plugin does not return a promise. It is synchronous.
This means that there is some I/O blocking involved.
Large state trees are not recommended with this plugin.
