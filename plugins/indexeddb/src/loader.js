"use strict";

import ApplicationState from '../../../index';
import Dexie from 'dexie';

/**
 * Utility class to handle loading saved state and setting up application state
 */
class StateLoader {
    /**
     * Initialize and load state for use with ApplicationState.
     * @param {String} db_name The name of the indexeddb to use to hold application state.
     */
    static async load(db_name) {
        if (!db_name) throw "The load method requires a database name";

        var state = {};
        let db = new Dexie(db_name);
        db.version(1).stores(
            {
                application_state: 'key'
            }
        );

        //prevent application from responding to state loading. also prevents wasted rewrite on
        //state persistence app listener
        ApplicationState.disable_notfication();

        let count = await db.application_state.count();
        if (!count)
            return ApplicationState.enable_notification();

        return db.application_state.each(
            (row) => {
                //if row is undefined, we've processed all rows
                if (!row) {
                    ApplicationState.enable_notification();
                }
                let { key, value } = row;
                //deserialize stringified literals, i.e. '1' -> 1
                // The try catch slows things down, but we don't have a choice.  For the most part
                // JSON.parse() just takes a value and passes it on if it's a number, date, object or array,
                // In the case of strings, it sometimes fails.
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    //noop
                }
                //put 'app' back in the path
                try {
                    ApplicationState._assignValue("app." + key, value);
                } catch (e) {
                    // we can't do that
                }
            }
        )
            // Ensure that notifications are re-enabled after all rows are processed
            .then(() => {
                ApplicationState.enable_notification();
            })
            .catch((err) => {
                ApplicationState.enable_notification();
            });
    }

}

export default StateLoader;
