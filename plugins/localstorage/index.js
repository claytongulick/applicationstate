/**
 * Loads and persists ApplicationState into localStorage
 * @author Joe Mills, Clayton Gulick
 * @module plugins/localstorage
 */

// Note: This plugin is all in index because it needs to be IE11 compatible
// and I didn't want the weight of all the polyfills.  Therefore I didn't
// do all the submodule stuff.  Someday, when the world is older and better,
// we will no longer have to support IE. Until that day... it's all one file
// cause I don't want to put up with the crap.
let ApplicationState;

export function init(app_state, db_name) {
  ApplicationState = app_state;
  if (db_name) {
    StateLoader.load(db_name);
    new StatePersistence(db_name);
  }
}

/**
 * Loads state into ApplicationState from localStorage.
 */
export const StateLoader = {
  load: function (db_name) {
    const storage_string = localStorage[db_name] || "{}";

    try {
      const state = JSON.parse(storage_string);

      ApplicationState.disable_notfication();

      const keys = Object.keys(state);
      for (let index = 0; index < keys.length; index++) {
        const key = keys[index];
        const value = state[key];

        ApplicationState._assignValue("app." + key, value);
      }

      ApplicationState.enable_notification();
    } catch (e) {
      ApplicationState.enable_notification();
      throw e;
    }
  }
}

export function StatePersistence(db_name) {
  this.db_name = db_name;
  ApplicationState.listen("app", this.onAppChange.bind(this));
  this.operation_queue = [];
}

StatePersistence.prototype.onAppChange = function (state, previous_state, modified_name) {
  if (ApplicationState._options[modified_name]) {
    let persist = ApplicationState._options[modified_name]['persist'];
    if (!persist)
      return;
  }

  let sub_path = modified_name.replace('app.', '');

  //first we need to chop off the 'app.' part of the path, since the object we're receiving /is/ 'app'
  //modified_name = modified_name.replace('app.', '');
  let value = ApplicationState._resolvePath(sub_path, state);

  this.operation_queue.push({
    state: state,
    full_path: modified_name,
    sub_path: sub_path,
    //deep clone object so we have a copy to ensure it hasn't been changed by the time we process it
    value: (typeof value === 'undefined') ? value : JSON.parse(JSON.stringify(value))
  });

  if (this.operation_queue.length > 1)
    return;

  processQueue.bind(this)();

  function processQueue() {
    if (this.operation_queue.length == 0)
      return;

    const item = this.operation_queue[0];

    //derive leaf keys and values from the state, if it's an object.
    //for an object, we only want to store leaf values, otherwise reconstruction
    //will be broken - i.e., if we pull a JSON object and assign it, but then we also pull a leaf
    //node that was set explicitly, who wins? to avoid that, we flatten all objects into a key list
    //and store the values associated with the flattened key. StateLoader will reverse this process
    let full_path = item.full_path;
    let sub_path = item.sub_path;
    let state = item.state;
    let value = item.value;

    //this code is a hellatious christmas tree because dexie hates async/await
    //first, clear the existing keys out
    //keys to remove
    let keys_to_remove = [];

    const state_string = localStorage[this.db_name] || "{}";

    try {
      const existing_state = JSON.parse(state_string);
      const primary_keys = Object.keys(existing_state);

      // Delete keys that no longer exist.
      for (let i = 0; i < primary_keys.length; i++) {
        const key = primary_keys[i];
        if (key.indexOf(sub_path) == 0) {
          //we need to make sure we're deleting the right stuff here.
          //consider the case of setting 'app.location' while we have
          //another setting that's 'locationPrevious'
          if (key.length > sub_path.length)
            if (key[sub_path.length] != '.')
              continue;

          delete existing_state[key];
        }
      }

      //now do an optimized write
      let immutable = ApplicationState._options[full_path] && ApplicationState._options[full_path]['immutable'];

      if (typeof value === 'undefined')
        return; //not doing a write, this must be a deleted key

      if (value && (typeof value === 'object') && !immutable) {
        let flattened = ApplicationState.flatten(value, sub_path);

        for (let index = 0; index < flattened.length; index++) {
          const item = flattened[index];
          existing_state[item.key] = item.value;
        }
      } else {
        let serialized_value = JSON.stringify(value);
        if (!serialized_value) serialized_value = "";
        existing_state[sub_path] = serialized_value;
      }

      const new_state_string = JSON.stringify(existing_state);
      localStorage[this.db_name] = new_state_string;

      this.operation_queue.shift();
      processQueue.bind(this)();
    } catch (e) {
      console.error("Error in saving state, probably a JSON parse error", e);
    }
  }
}
