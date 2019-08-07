# ApplicationState API

The API for Application is very simple, there is currently no constructor everything is implemented statically:

## Methods

### `static get(name)`

<table>
  <thead>
    <tr>
      <th>Argument</th>
      <th>Type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>name</td>
      <td>String</td>
      <td>The name of the desired node within the state tree.</td>
    </tr>
  </tbody>
</table>

Return the value at the given path.

### `static set(name, value)`

<table>
  <thead>
    <tr>
      <th>Argument</th>
      <th>Type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>name</td>
      <td>String</td>
      <td>The name of the desired node within the state tree.</td>
    </tr>
    <tr>
      <td>value</td>
      <td>Object|Array|Scalar</td>
      <td>The value to place at the specified node within the state tree.</td>
    </tr>
  </tbody>
</table>

Set the value at the specified path.

### `static listen(name, callback)`

<table>
  <thead>
    <tr>
      <th>Argument</th>
      <th>Type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>name</td>
      <td>String</td>
      <td>The name of the desired node to center the listener on.</td>
    </tr>
    <tr>
      <td>callback</td>
      <td>Function</td>
      <td>The function to execute when a node within the </td>
    </tr>
  </tbody>
</table>

Listen for changes at the specified path, invoking the callback with the new and old values. Callback should be of the form:

    #!js
    (new_value, old_value) => { ... }

A listener key will be returned, it can be used later to remove the listener, if needed.

### `static removeListener(name, key)`

<table>
  <thead>
    <tr>
      <th>Argument</th>
      <th>Type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>name</td>
      <td>String</td>
      <td>The name of the desired node where the listener was set.</td>
    </tr>
    <tr>
      <td>key</td>
      <td>String</td>
      <td>The listener key that was returned when the listener was first set.</td>
    </tr>
  </tbody>
</table>

Remove the listener at the specified path with the given key

### `static ln(target, link_path)`

<table>
  <thead>
    <tr>
      <th>Argument</th>
      <th>Type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>target</td>
      <td>String</td>
      <td>The existing node to be linked.</td>
    </tr>
    <tr>
      <td>link_path</td>
      <td>String</td>
      <td>The path to create as a link.</td>
    </tr>
  </tbody>
</table>

This is similar the the unix "ln" symlink functionality. It is used to link a node to another area in the graph. The linked node can be used interchangably with the original. Listeners will be notified on both the original path and the symlinked path.

### `static rm(name)`

<table>
  <thead>
    <tr>
      <th>Argument</th>
      <th>Type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>name</td>
      <td>String</td>
      <td>The name of the node to fully remove from the state tree.</td>
    </tr>
  </tbody>
</table>

Delete the specified path. If the path refers to an object or array, everything with that object or array is also removed. If the target is a symlink, only the symlink will be removed. If a node pointed to by a symlink is deleted, the symlink will also be deleted.

### `static notify(name, explicit, options)`

<table>
  <thead>
    <tr>
      <th>Argument</th>
      <th>Type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>name</td>
      <td>String</td>
      <td>The name of the node to center the notification on.</td>
    </tr>
    <tr>
      <td>explicit</td>
      <td>Boolean</td>
      <td>Do not notify up or down the state tree, just notify the path specified.</td>
    </tr>
    <tr>
      <td>options</td>
      <td>Object</td>
      <td>Used by plugins.</td>
    </tr>
  </tbody>
</table>

Used to trigger a listener. If explicit is set to true, only a listener that is directly pointing at the specified node will be triggered, hierarchical listeners will not. The options parameter is reserved for use by plugin authors and carries information such as whether the changed value should be persisted.

### `static undo(name)`

<table>
  <thead>
    <tr>
      <th>Argument</th>
      <th>Type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>name</td>
      <td>String</td>
      <td>The name of the node to be reverted to the previous value.</td>
    </tr>
  </tbody>
</table>

Revert changes to state for the specific name. Note: this honors the hierarchy, so it will navigate through all
child names and undo any changes below it. So, for example, if you were to call undo('app') and 'app' was the top
level key in your application, any changes to any child of app will be rewound, 'app.login', 'app.user.role' etc...

If there is no previous state for the specified value, it will be set to undefined.