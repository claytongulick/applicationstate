# Getting Started

## Instalation

ApplicationState is available through `npm`.

    #!bash
    npm install applicationstate

## Basics

ApplicationState uses string versions of object references to do lookups in the state tree. In practical terms, that means however you would reference the object in plain old JavaScript is how it is referenced in the string. For a deeper understanding of how the reference strings work see [documentation about references](/references).

### The Importance of the "`app`" Root Node

While you can set the root of each string reference to anything, ApplicationState hangs a lot of functionality around the root node being `app`. In particular the notification system will not fire for anything that is not under `app`. This is by design.

For example, if you want to have something that is in ApplicationState but never triggers a notification (and thus most plugins won't pick it up), you can set it to `cache.<your thing>` or `temp.<your thing>`. When you set `<your thing>`, nothing but the set happens. If you set `app.<your thing>`, then a notification is fired and anything listening will respond.

**NOTE: It is best to set everything to `app` unless you know what you are doing.**

## Getting and Setting

ApplicationState is designed to store, retrive, and react to changes in state. For example:

    #!js
    ApplicationState.set("app.something", "something");
    const something = ApplicationState.get("app.something");
    console.log(something); // prints "something";

This seems to act like a key-value store, but it's a bit more than that. For example:

    #!js
    ApplicationState.set("app.something.nested", "nested");
    const something = ApplicationState.get("app.something");
    console.log(something); // prints { something: "nested" }

As you can see, ApplicationState takes care of referencing and de-referencing the state graph. You can create a node in the graph using this method. Note that prior to this, neither `something` nor `nested` existed on the state graph until we set it. ApplicationState takes care of that for you.

Lastly, you can connect two different parts of the state graph together using linking.

    #!js
    ApplicationState.set("app.something.nested", "nested");
    ApplicationState.ln("app.something.nested", "app.a_link");
    const something = ApplicationState.get("app.a_link");
    console.log(something); // prints "nested"

    ApplicationState.set("app.a_link", "changed");
    const changed = ApplicationState.get("app.something.nested");
    console.log(changed); // prints "changed"

Notice that in the above example, you can change the original or the linked item and the value for both is changed. It works a lot like the linux `ln` command.

## Reacting to Changes

Keeping state is great, but many times you need a means to know when the state has changed. ApplicationState provides branch level notifications rather than just node level. This means that if anything changes within a child node of the state graph, all of it's parent elements will also get a notification, all the way up to the top level node. A perfect example of another system that works this way is the DOM.

Here's an example of a few listeners.

    #!js
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

The implications of being able to watch a branch rather than a node are significant. It allows an application to react to changes on multiple levels with relative ease.

Removing listeners is a simple process, but requires you save the reference to the listener.

    #!js
    const listener_id = ApplicationState.listen("app.something.nested", () => {});
    ApplicationState.removeListener(listener_id);
