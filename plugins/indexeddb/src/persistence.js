"use strict";

import ApplicationState from '../../../index';
import Dexie from 'dexie';

/**
 * Utility class that listens for changes to the root 'app' state and persists them to native storage
 * using React's AsyncStorage class
 */
class StatePersistence {
    /**
     * Construct a new instance of StatePersistence for the indicated database.
     * @param {String} db_name The name of the database to write to.
     */
    constructor(db_name) {
        let db = new Dexie(db_name);
        db.version(1).stores(
            {
                application_state: 'key'
            }
        );
        this.db = db;
        this.operation_queue = [];

        ApplicationState.listen('app', this.onAppChange.bind(this));
    }

    /**
     * Listen for a change in the application state and persist it in an optimized way.
     * We queue changes to ensure operations happen in order, since db writes and reads are async.
     * 
     * @param state
     * @param previous_state
     * @param modified_name
     */
    onAppChange(state, previous_state, modified_name) {
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
        //if there are already items in the queue, they are being worked by another 'thread'
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

            //TODO: at some point, try to make transactions work. after hours of struggle, can't get
            //dexie transactions to work right, so giving up.

            //get all the keys and check to see if they contain our path
            this.db.application_state
                .toCollection()
                .primaryKeys()
                .then(
                    (primary_keys) => {
                        for (let i = 0; i < primary_keys.length; i++) {
                            const key = primary_keys[i];
                            if (key.indexOf(sub_path) == 0) {
                                //we need to make sure we're deleting the right stuff here.
                                //consider the case of setting 'app.location' while we have
                                //another setting that's 'locationPrevious'
                                if (key.length > sub_path.length)
                                    if (key[sub_path.length] != '.')
                                        continue;

                                keys_to_remove.push(primary_keys[i]);
                            }

                        }

                        if (keys_to_remove.length)
                            return this.db.application_state.bulkDelete(keys_to_remove);
                    }
                )
                .then(
                    () => {
                        //now do an optimized write
                        let immutable = ApplicationState._options[full_path] && ApplicationState._options[full_path]['immutable'];

                        if (typeof value === 'undefined')
                            return new Promise((resolve, reject) => { resolve(); }); //not doing a write, this must be a deleted key

                        if (value && (typeof value === 'object') && !immutable) {
                            let flattened = ApplicationState.flatten(value, sub_path);
                            return this.db.application_state
                                .bulkPut(flattened)
                                .then((result) => {
                                    return result;
                                })
                                .catch(
                                    (err) => {
                                        alert("Error saving state: " + JSON.stringify(error));
                                        console.trace(error);
                                    }
                                );
                        }
                        else {
                            let serialized_value = JSON.stringify(value);
                            if (!serialized_value) serialized_value = "";
                            return this.db.application_state
                                .put({ key: sub_path, value: serialized_value })
                                .then((result) => {
                                    return result;
                                })
                                .catch(
                                    (err) => {
                                        alert("Error saving state: " + JSON.stringify(error));
                                        console.trace(error);
                                    }
                                );
                        }

                    }
                )
                .then(() => {
                    this.operation_queue.shift();
                    return processQueue.bind(this)();
                })
                .catch((error) => {
                    alert("Error saving state: " + JSON.stringify(error));
                    console.trace(error);
                });
        }
    };
}

export default StatePersistence;
