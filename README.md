# ApplicationState
Utility for maintaining stateful applications

[![CircleCI](https://circleci.com/gh/blargism/applicationstate/tree/master.svg?style=svg)](https://circleci.com/gh/blargism/applicationstate/tree/master)

## About
ApplicationState is a simpler approach to state management. It is not opinionated, aims to be framework agnostic and has no external dependencies. There is a plugin system allowing state to be persised or otherwise processed.

## Getting Started
ApplicationState usage is intend to be simple and direct.

For a deeper understanding of how the reference strings work see the "Working with References" section below.

### Getting and Setting
ApplicationState is designed to store, retrive, and react to changes in state.  For example:

```javascript
ApplicationState.set("app.something", "something");
const something = ApplicationState.get("app.something");
console.log(something); // prints "something";
```

This seems to act like a key-value store, but it's a bit more than that.  For example:

```javascript
ApplicationState.set("app.something.nested", "nested");
const something = ApplicationState.get("app.something");
console.log(something); // prints { something: "nested" }
```

As you can see, ApplicationState takes care of referencing and de-referencing the state graph.  You can create a node in the graph using this method.  Note that prior to this, neither `something` nor `nested` existed on the state graph until we set it.  ApplicationState takes care of that for you.

Lastly, you can connect two different parts of the state graph together using linking.

```javascript
ApplicationState.set("app.something.nested", "nested");
ApplicationState.ln("app.something.nested", "app.a_link");
const something = ApplicationState.get("app.a_link");
console.log(something); // prints "nested"

ApplicationState.set("app.a_link", "changed");
const changed = ApplicationState.get("app.something.nested");
console.log(changed); // prints "changed"
```

Notice that in the above example, you can change the original or the linked item and the value for both is changed.  It works a lot like the linux `ln` command.

### Reacting to Changes
Keeping state is great, but many times you need a means to know when the state has changed.  ApplicationState provides branch level notifications rather than just node level. This means that if anything changes within a child node of the state graph, all of it's parent elements will also get a notification, all the way up to the top level node.  A perfect example of another system that works this way is the DOM.

Here's an example of a few listeners.

```javascript
ApplicationState.set("app.parent.child_one", "rebelious");
ApplicationState.set("app.parent.child_two", "obedient");

// Child level listener
ApplicationState.listen("app.parent.child_one", (new_value, old_value) => {
    console.log("child level", new_value, old_value);
});

// Parent level listener
ApplicationStaate.listen("app.parent", (new_value, old_value) => {
    console.log("parent_level", new_value, old_value);
});

ApplicationState.set("app.parent.child_one", "reformed");
// The parent level listener will print "child_level", "reformed", "rebelious"
// The child level listener will print
//    "parent_level",
//    { child_one: "reformed", child_two: "obedient" },
//    { child_one: "rebelious", child_two: " obedient" }
```

The implications of being able to watch a branch rather than a node are significant.  It allows an application to react to changes on multiple levels with relative ease.

Removing listeners is a simple process, but requires you save the reference to the listener.

```javascript
const listener_id = ApplicationState.listen("app.something.nested", () => {});
ApplicationState.removeListener(listener_id);
```

## Working With References
The reference system in ApplicationState is meant to follow the same syntax as object traversal in regular JavaScript.

For instance in the following object:

```javascript
const obj = {
    internal_obj: {
        item: "abc123"
    }
};

ApplicationState.set("app.obj", obj);
```

You would fetch the value assigned to `item` like this:

```javascript
const app_state_value = ApplicationState.get("app.obj.internal_obj.item");
const js_value = obj.internal_obj.item;
console.log(app_state_value === js_value); // prints true
```

Note the similarity. In both cases the dot syntax provides a reference to the value.  The same applies for array access.

```javascript
const obj = {
    internal_array: [
        "abc123"
    ]
}
ApplicationState.set("app.obj", obj);

const app_state_value = ApplicationState.get("app.obj.internal_array[0]");
const js_value = obj.internal_array[0];
console.log(app_state_value === js_value); // prints true
```

This works for all sorts of object types, including objects within arrays and arrays of arrays.

## Available Plugins
At this time, the only plugin available is for the browser using indexedDB. It can be found in `plugins/indexeddb` and is importable as a module from there.

Also, it can be loaded from the dist folder for non-module access.

## Usage

The API for Application is very simple, there is currently no constructor everything is implemented statically:

### ApplicationState.get(name)
Return the value at the given path

### ApplicationState.set(name, value)
Set the value at the specified path

### ApplicationState.listen(name, callback)
Listen for changes at the specified path, invoking the callback with the new and old values. Callback should be of the form:
    (new_value, old_value) => { ... }
A listener key will be returned, it can be used later to remove the listener, if needed.

### ApplicationState.removeListener(name, key)
Remove the listener at the specified path with the given key

### ApplicationState.ln(target, link_path)
This is similar the the unix "ln" symlink functionality. It is used to link a node to another area in the graph. The linked node can be used interchangably with the original. Listeners will be notified on both the original path and the symlinked path.

### ApplicationState.rm(name)
Delete the specified path. If the target is a symlink, only the symlink will be removed.
If a node pointed to by a symlink is deleted, the symlink will also be deleted.

### ApplicationState.notify(name, explicit, options)
Used to trigger a listener. If explicit is set to true, only a listener that is directly pointing at the specified node will be triggered, hierarchical listeners will not. The options parameter is reserved for use by plugin authors and carries information such as whether the changed value should be persisted.

### ApplicationState.undo(name)
Revert changes to state for the specific name. Note: this honors the hierarchy, so it will navigate through all
child names and undo any changes below it. So, for example, if you were to call undo('app')  and 'app' was the top
level key in your application, any changes to any child of app will be rewound, 'app.login', 'app.user.role' etc...

If there is no previous state for the specified value, it will be set to undefined.

## Theory and Design
ApplicationState, as it's name implies, is used for maintaining state in applications. It is a different approach to solving the classic problem, and is language agnostic though this implementation is in JavaScript.

Over the years many patterns have emerged in software architecture - all trying to solve the same fundamental problem: maintain state, and react to changes in state.

Even the simplest "hello world" application can be thought of in these terms:

    let message = "hello, world!";
    console.log(message);

In this case, we're declaring an inital state - i.e. setting some data region in memory to "hello, world!", and then subsequently changing the state of the user's command line by emitting the message.

As applications become larger state management becomes more complex. Over the years there have been many formal and informal approaches to solving the state problem, some examples are MVC, MVP, MVVM, Reactive, etc... the definitions get fuzzy at times and overlap, but they all have one thing in common - there's some sort of state that's maintained and changes to that state cause the application to change somehow. There are advantages and disadvantages to each approach, theories of code decoupling, event driven approaches, etc...

Instead of discrete models, ApplicationState recogizes that the entire state of any application can be represented as a directed acyclic graph, where each node in the graph itentifies some part of the application and each leaf contains a discrete value. (Actually, nodes can be pointers to other nodes, but this is a convenience sugaring covered in advanced topics).

Here's a simple example. Imagine an application that has a simple login form, a list of jobs, and a screen that can be used to view or edit a job.

Here's a rough graph of what the overall state of that application might look like:

![graph diagram](./docs/state_graph.png "State Graph Example")


In the above graph, the root node is "app", with a leaf called "location" and three child nodes, "user","screen" and "current_job".

Under the user node we have some leaves with values for things like username and access_token, under "screen" we have "login", "job_list" and "job_view_edit", etc...

Using the above graph, any part of the application state can be represented using simple dotted notation. For example:

    app.location
    app.screen.login.username
    app.user.access_token

With application state, this is how you both set and retrieve values.

At this point, it's natural to wonder what value this approach takes above a simple object that can be represented in any language. That brings us to the second part of the ApplicationState theory, which is responding to changes.

Imagine that you need to validate that a username is valid after a user has entered it. Using ApplicationState, you'd add a listener to app.screen.login.username to be notified of the change, run the validation and mutate the UI in response.

Followers of reactive application flow will be very familiar with this approach. One of the advantages to the ApplicationState approach, however, is the ability to add a listener to any node or leaf in the graph and to be notified of changes that have occurred in the subgraph.

For example, maybe your application would like to keep a log of all changes that occurred when a job was being edited. Adding a listener to app.screen.job_view_edit would accomplish this trivially.

The key architectural insight of ApplicationState is that ALL of your UI state is represented by the graph and can be instantly stored and retrieved. This is particularly useful, for example, in mobile applications where the application can be killed and restarted at any time, and the expectation is that state will be restored properly.

In the [BARE architecture repo](https://github.com/claytongulick/BARE), there is documentation about how ApplicationState can fit into an overall reactive architecture, though it should be noted that ApplicationState is *not* limited to [BARE](https://github.com/claytongulick/BARE) and can be used easily with React, React Native, etc...

This is a brief summary of the ApplicationState theory, there is a lot more to it with tons of handy featues like:

 * Previous state / undo
 * Linked nodes
 * Plugins for persistence, loading and additional functionality (see applicationstate-plugins-indexeddb for persistence and loading from IndexedDB in the browser)
 * Notification control

 Future features will include:
 * Isomorphism plugin - automatic sync to the server
 * Merkle tree implementation for auto change detection/tree syncing
 * Sub graph splitting and merging
 * Cloud functions that respond to listeners/changes using AWS lambda, Google cloud functions, etc...

 Once the above features are implemented, many applications will be able to full implemented "serverless"

## Referencing and Dereferencing

The means of getting and setting items within the state tree is accomplished via a dereferenced string.  Here are some examples:

```javascript
{ a: 1 } // key: 'a', value: '1'
{ a: { b: 1 } } // key: 'a.b', value: '1'
{ a: [ { b: 1 } ] } // key: 'a.[0].b', value: '1'
```

As you can see, the object hieracrhy is represented by variable names separated by either a `.` in the case of objects, or `.[#].` in the case of an array.

These dereferenced strings can later be used to retrive a single value or a portion from within the state tree.  Consider the following:

```javascript
// the current state
{ a: 1, b: "2", c: { c1: "3", c2: "4" } }

const c = ApplicationState.get('c');
// we get { c1: "3", c2: "4" }

const c1 = ApplicationState.get('c.c1');
// we get "3"
```

## Running Tests
Since this module is designed for the browser and designed to be run as a module, we use the webpack to create a testing environment run in the browser.  This is accomplished through [webpack-serve](https://github.com/webpack-contrib/webpack-serve).  Follow these steps to get it running.

```
// install development dependencies
npm install

// run the webpack server and open the tests in default browser
npm test

// stop the server with ctrl-c
```

Unlike most approaches to testing, the webpack-server keeps going.  This enables you to update both the library and unit tests and see instant updates durring development.  Of course the down side to that is you need to put in the momentous effort to `ctrl-c` to stop the server once you are done.
