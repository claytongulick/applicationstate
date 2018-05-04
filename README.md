# ApplicationState
Utility for maintaining stateful applications

## About
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

TODO: insert diagram

In the above graph, the root node is "app", with a leaf called "location" and three child nodes, "user","screen" and "current_job".

Under the user node we have some leaves with values for things like username and access_token, under "screen" we have "login", "job_list" and "job_view_edit", etc...

Using the above graph, any part of the application state can be represented using simple dotted notation. For example:

    app.location
    app.screen.login.username
    app.user.access_token

With application state, this is how you both set and retrieve values.

At this point, it's natural to wonder what value this approach takes above a simple object that can be represented in any language. That brings us to the second part of the ApplicationState theory, which is responding to changes.

Imagine that you need to validate that a username is valid after a user has entered it. Using ApplicationState, you'd add a listener to app.screen.login.username to be notified of the change, run the validation and mutute the UI in response.

Followers of reactive application flow will be very familiar with this approach. One of the advantages to the ApplicationState approach, however, is the ability to add a listener to any node or leaf in the graph and to be notified of changes that have occurred in the subgraph.

For example, maybe your application would like to keep a log of all changes that occurred when a job was being edited. Adding a listener to app.screen.job_view_edit would accomplish this trivially.

The key architectural insight of ApplicationState is that ALL of your UI state is represented by the graph and can be instantly stored and retrieved. This is particularly useful, for example, in mobile applications where the application can be killed and restarted at any time, and the expectation is that state will be restored properly.

In the BARE architecture repo, there is an example of an application that uses stage components to listen to the node at app.location and sets the UI state based on the value of that node.

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