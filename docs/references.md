# Referencing and Dereferencing

## Syntax

The means of getting and setting items within the state tree is accomplished via a dereferenced string. Here are some examples:

    #!js
    const example_1 = {
      a: 1
    };
    // key: 'a', value: '1'

    const example_2 = {
      a: {
        b: 1
      }
    };
    // key: 'a.b', value: '1'

    const example_3 = {
      a: [
        {
          b: 1
        }
      ]
    };
    // key: 'a[0].b', value: '1'

As you can see, the object hieracrhy is represented by variable names separated by either a `.` in the case of objects, or `[#].` in the case of an array.

These dereferenced strings can later be used to retrive a single value or a portion from within the state tree. Consider the following:

    #!js
    // the current state tree in ApplicationState
    const example_state = {
      a: 1,
      b: "2",
      c: {
        c1: "3",
        c2: "4"
      }
    };

    const c = ApplicationState.get("c");
    // we get { c1: "3", c2: "4" }

    const c1 = ApplicationState.get("c.c1");
    // we get "3"

## Practical Examples

The reference system in ApplicationState is meant to follow the same syntax as object traversal in regular JavaScript.

For instance in the following object:

    #!js
    const obj = {
      internal_obj: {
        item: "abc123"
      }
    };

    ApplicationState.set("app.obj", obj);

You would fetch the value assigned to `item` like this:

    #!js
    const app_state_value = ApplicationState.get("app.obj.internal_obj.item");
    const js_value = obj.internal_obj.item;
    console.log(app_state_value === js_value); // prints true

Note the similarity. In both cases the dot syntax provides a reference to the value. The same applies for array access.

    #!js
    const obj = {
      internal_array: ["abc123"]
    };

    ApplicationState.set("app.obj", obj);

    const app_state_value = ApplicationState.get("app.obj.internal_array[0]");
    const js_value = obj.internal_array[0];
    console.log(app_state_value === js_value); // prints true

This works for all sorts of object types, including objects within arrays and arrays of arrays.
