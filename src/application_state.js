/**
 * This class maintains the overall application state in a platform-agnostic way.
 * Application states are key-value pairs, where the value is normally an object, but can be any serializable
 * data type.
 * A useful feature of this class is that all changes to the application state are stored, and can be restored via
 * a simple call to undo(name)
 *
 * @author Clay Gulick
 */
class ApplicationState {

    /**
     * Return the value for the specific state instance
     * @param name
     * @returns {*}
     */
    static get(name) {
        name = ApplicationState._dereferencePath(name);
        return ApplicationState._resolvePath(name);
    }

    /**
     * Gets a specified path, or sets it with the default values if it's not present.
     * @param {String} name The path to either get or set.
     * @param {*} defaults The value to set if not present.
     * @param {Object} options The options object to use for this path.
     */
    static getOrSet(name, defaults, options) {
        const value = ApplicationState.get(name);
        if (value !== undefined) return value;

        ApplicationState.set(name, defaults, options);

        return ApplicationState.get(name);
    }

    /**
     * Register a callback for listening to changes to the state.
     * @param name
     * @param callback function Of the form callback(new_value, old_value) where value will be passed to the callback
     * @returns {String} The listener key to pass back when removing the listener.
     */
    static listen(name, callback) {
        if (!ApplicationState._listeners[name])
            ApplicationState._listeners[name] = [];
        ApplicationState._listenerKey++;
        callback._listenerKey = ApplicationState._listenerKey;
        ApplicationState._listeners[name].push(callback);
        return callback._listenerKey;
    }

    /**
     * Remove the listener on the specified name for the specified key
     * @param name
     * @param key
     */
    static removeListener(name, key) {
        if (!ApplicationState._listeners[name]) return;

        //forEach here is a a touch wasteful, but just double checking that all listeners for the key are removed
        //though there should only ever be one
        ApplicationState._listeners.forEach((listener, index) => {
            if (listener._listenerKey == key) {
                ApplicationState._listeners.splice(index, 1);
            }
        })
    }

    /**
     * Set the state value, triggers listeners.
     * If name is a dotted expression, i.e. app.jobs.12345 then any listeners on "parent" elements will also be
     * notified of the change. So, for example if set is called on 'app.jobs.12345' and there is a listener on 'app.jobs'
     * then the 'app.jobs' listener will also be notified, and so on.
     * @param name
     * @param value
     * @param options object {notify: true, immutable: false, persist: true}
     */
    static set(name, value, options) {
        name = ApplicationState._dereferencePath(name);
        let default_options = {
            //trigger notifications?
            notify: true,
            //a specific list of paths to exclude from being notified
            exclude_notification_paths: [],
            //a list of specific listener keys that should not be notified of changes
            exclude_notification_listeners: [],
            //is this a changeable object?
            immutable: false,
            //should this value be persisted?
            persist: true,
            //do we want to maintain previous state?
            save_previous: true
        };
        options = Object.assign(default_options, options);
        ApplicationState._options[name] = options;
        if (!ApplicationState._previousState[name] && options.save_previous)
            ApplicationState._previousState[name] = [];
        if (options.save_previous) {
            let previous_value = ApplicationState._resolvePath(name);
            if (!(typeof previous_value === 'undefined'))
                ApplicationState._previousState[name].push(previous_value);
        }
        ApplicationState._assignValue(name, value);
        ApplicationState.notify(name, false, options);
    }


    /**
     * Internal utility function to set value at a dotted path
     * @param path
     * @param value
     * @param object Object optional object that can be substituted for use instead of ApplicationState._state
     * @private
     */
    static _assignValue(path, value, object) {
        object = object || ApplicationState._state;

        const nodes = ApplicationState.walk(path);

        for (let index = 0; index < nodes.length; index++) {
            const node = nodes[index];
            switch (node.type) {
                case 'object':
                    if (typeof object[node.name] === 'undefined') {
                        object[node.name] = {};
                    }
                    object = object[node.name];
                    break;
                case 'array':
                    if (typeof object[node.name] === 'undefined') {
                        object[node.name] = [];
                    }
                    object = object[node.name];
                    break;
                case 'leaf':
                    return object[node.name] = value;
                    break;
            }
        }

        throw Error("We should have returned after setting the value.");
    }

    /**
     * Similar to *nix ln command, this creates a "symlink" between nodes
     * Example: ApplicationState.ln('app.assessments.1234', 'app.current_assessment');
     * @param target string The path to the real, existing node that a link is being created for
     * @param link_path string The path to the new symlink
     */
    static ln(target, link_path) {
        if (!ApplicationState._symlinks)
            ApplicationState._symlinks = {};
        //this is an optimization to store backrefs from targeted nodes. It makes lookups for notifications fast
        if (!ApplicationState._reverse_symlinks)
            ApplicationState._reverse_symlinks = {};

        target = ApplicationState._dereferencePath(target);
        let parts = link_path.split('.');
        let leaf = parts.slice(-1);
        //dereference the parent path so that its materialized.
        let parent_path = ApplicationState._dereferencePath(parts.slice(0, -1).join('.'));
        link_path = parent_path + '.' + leaf;

        ApplicationState._symlinks[link_path] = target;
        if (!(ApplicationState._reverse_symlinks[target]))
            ApplicationState._reverse_symlinks[target] = [];
        //a node can be referred to by multiple symlinks, so we store an array
        ApplicationState._reverse_symlinks[target].push(link_path);
    }

    /**
     * Delete the specified path. If the target is a symlink, only the symlink will be removed.
     * If a node pointed to by a symlink is deleted, the symlink will also be deleted.
     *
     * @param target
     * @param object an optional alternate object to operate on instead of ApplicationState._state
     */
    static rm(target, object) {
        object = object || ApplicationState._state;
        let original_path = target; //save this for notifications
        if (target === 'app')
            return;
        if (!target)
            return;

        target = ApplicationState._materializePath(target);

        function removeSymlink(target, keep_referrers) {
            let link_target = ApplicationState._symlinks[target];
            delete ApplicationState._symlinks[target];

            if (!keep_referrers) {
                let referrers = ApplicationState._reverse_symlinks[link_target];
                referrers.splice(referrers.indexOf(target), 1);
            }
        }

        function isSymlink(target) {
            return !!(ApplicationState._symlinks && ApplicationState._symlinks[target]);
        }

        function referredTo(target) {
            return !!(ApplicationState._reverse_symlinks && ApplicationState._reverse_symlinks[target]);
        }

        //first, check to see if this is a symlink. If so, just remove it from the symlink trackers
        if (isSymlink(target))
            return removeSymlink(target);

        if (referredTo(target)) {
            ApplicationState._reverse_symlinks[target]
                .forEach(
                    (symlink) => {
                        removeSymlink(target, true);
                    }
                );
            delete ApplicationState._reverse_symlinks[target];
        }

        let parts = target.split('.');
        let leaf = parts.slice(-1)[0];
        //strip off the leaf
        parts = parts.slice(0, -1);
        for (let i = 0; i < parts.length; i++) {
            object = object[parts[i]];
            if (typeof object === 'undefined')
                throw new Error('Undefined target in ApplicationState.rm: ' + target);
        }
        delete object[leaf];

        let options = ApplicationState._options[original_path];
        if (!options)
            options = {
                //trigger notifications?
                notify: true,
                //a specific list of paths to exclude from being notified
                exclude_notification_paths: [],
                //a list of specific listener keys that should not be notified of changes
                exclude_notification_listeners: [],
                //is this a changeable object?
                immutable: false,
                //should this value be persisted?
                persist: true,
                //do we want to maintain previous state?
                save_previous: true
            };
        ApplicationState.notify(original_path, false, options);

    }

    /**
     * Return a materialized path that follows symlinks in the original path.
     * Example:
     * ApplicationState.ln('app.assessments.1234','app.current_assessment');
     * ApplicationState.ln('app.current_assessment.topics.bathing', 'app.current_assessment.topics.current_topic');
     *
     * ApplicationState._dereferencePath('app.current_assessment.topics.current_topic')
     * returns: 'app.assessments.1234.topics.bathing'
     * @param path
     * @private
     */
    static _dereferencePath(path) {
        if (!ApplicationState._symlinks)
            return path;

        const nodes = ApplicationState.walk(path);

        for (let index = 0; index < nodes.length; index++) {
            const node = nodes[index];
            if (ApplicationState._symlinks[node.path]) {
                path = path.replace(node.path, ApplicationState._symlinks[node.path]);
                return ApplicationState._dereferencePath(path);
            }
        }

        return path;
    }

    /**
     * This essentially does the opposite of _dereferencePath, which is that it will return an array of all combinations
     * of symlinks that point to this path.
     * Example:
     * ApplicationState.ln('app.assessments.1234','app.current_assessment');
     * ApplicationState.ln('app.current_assessment.topics.bathing', 'app.current_assessment.topics.current_topic');
     *
     * ApplicationState._reverseSymlink('app.assessments.1234.topics.bathing.value')
     * returns: [
     * 'app.assessments.1234.topics.current_topic.value',
     * 'app.current_assessment.topics.current_topic.value',
     * 'app.current_assessment.topics.bathing.value'
     * ]
     * @param path
     * @private
     */
    static _reverseSymlink(path) {
        if (path.indexOf('.') < 0) return [];
        let symlinks = [];
        let resolved_symlinks = [];

        function addParentSymlinks(path) {
            let parts = path.split('.');
            let leaf = parts.slice(-1);
            let parent_path = parts.slice(0, -1).join('.');
            let parent_symlinks = ApplicationState._reverseSymlink(parent_path);
            parent_symlinks.forEach(
                (symlink) => {
                    resolved_symlinks.push(symlink + "." + leaf);
                }
            )
        }

        if (ApplicationState._reverse_symlinks[path])
            symlinks = ApplicationState._reverse_symlinks[path];

        symlinks.forEach(
            (symlink) => {
                addParentSymlinks(symlink);
            }
        );

        addParentSymlinks(path);

        return symlinks.concat(resolved_symlinks);
    }

    /**
     * This is similar to _deferencePath, except it will not completely dereference the path, it will only dereference
     * the parent path of the pointed to node
     * Example:
     * ApplicationState.ln('app.assessments.1234','app.current_assessment');
     * ApplicationState.ln('app.current_assessment.topics.bathing', 'app.current_assessment.topics.current_topic');
     *
     * ApplicationState._materializePath('app.current_assessment.topics.current_topic')
     * returns: 'app.assessments.1234.topics.current_topic'
     * Application.ln(
     * @param path
     * @private
     */
    static _materializePath(path) {
        let parts = path.split('.');
        let leaf = parts.slice(-1);
        //dereference the parent path so that its materialized.
        let parent_path = ApplicationState._dereferencePath(parts.slice(0, -1).join('.'));
        return parent_path + '.' + leaf;
    }

    /**
     * Internal utility function to dereference dotted path to a specific object/value
     * @param path either a simple string key, a dotted string or an array that indicates the path
     * @param object Object optional object that can be substituted for use instead of ApplicationState._state
     * @private
     */
    static _resolvePath(path, object) {
        if (typeof path !== 'string') throw Error("Requires a string, got an " + typeof path + " that " + Array.isArray(path) ? "is" : "isn't" + " an array");

        object = object || ApplicationState._state;
        const nodes = ApplicationState.walk(path);

        for (let index = 0; index < nodes.length; index++) {
            const node = nodes[index];
            object = object[node.name];
            if (typeof object === 'undefined') return undefined;
            if (object === null) return null;
        }

        return object;
    }

    /**
     * Triggers a notification, or 'get' of a value in the application state.
     * @param name
     * @param explicit Boolean indicate whether to notify up/down the hierarchy
     */
    static notify(name, explicit, options) {
        if (ApplicationState._disable_notification) return;

        /**
         * Send the actual notification.
         *
         * @param listener
         * @param name the place in the hierachy that's triggering the send
         * @param modified_name the name of the hierarchical key that was actually modified, may be different than `name`
         */
        function send(listener, name, modified_name) {
            if (options.exclude_notification_listeners.indexOf(listener._listenerKey) >= 0)
                return;

            name = ApplicationState._dereferencePath(name);
            if (ApplicationState._previousState[name])
                return listener(
                    ApplicationState._resolvePath(name),
                    ApplicationState._previousState[name][ApplicationState._previousState[name].length - 1],
                    modified_name
                );
            //no previous state, set undefined
            listener(ApplicationState._resolvePath(name), undefined, modified_name);
        }

        /**
         * If there's a symlink that points to this path, invoke any listeners on the symlink
         * @param name
         */
        function notifySymlink(name) {
            if (!ApplicationState._symlinks)
                return;

            //if there's a symlink that refers to this path
            let symlinks = ApplicationState._reverseSymlink(name);
            //and there's a listener on that symlink, trigger that notification
            symlinks.forEach(
                symlink => {
                    if (!ApplicationState._listeners[symlink]) return;
                    if (options.exclude_notification_paths.indexOf(symlink) >= 0) return;

                    ApplicationState._listeners[symlink].forEach((listener) => {
                        send(listener, symlink);
                    });
                }
            );
        }

        //notify listeners up the hierarchy
        function notifyUp(name) {
            const nodes = ApplicationState.walk(name);
            for (let index = 0; index < nodes.length; index++) {
                const node = nodes[index];
                if (node.type === "leaf") continue;
                notifySymlink(node.path);
                if (options.exclude_notification_paths.indexOf(node.path) >= 0) continue;

                if (ApplicationState._listeners[node.path])
                    ApplicationState._listeners[node.path].forEach(listener => send(listener, node.path, name));
            }
        }

        //notify on an explicit name
        function notifyExplicit(name) {
            notifySymlink(name);

            if (!ApplicationState._listeners[name]) return;
            if (options.exclude_notification_paths.indexOf(name) >= 0) return;

            ApplicationState._listeners[name].forEach(listener => send(listener, name));
        }

        // recursively notify down the hierarchy
        // This function doesn't just notify down the chain of the string name, it goes across all sub-objects and arrays.
        function notifyDown(name) {
            const obj = ApplicationState._resolvePath(name);
            if (!obj) return;
            if (!(typeof obj === 'object')) return;

            if (Array.isArray(obj)) {
                const lngth = obj.length;
                for (let index = 0; index < lngth; index++) {
                    const subname = name + "[" + index + "]";
                    notifySymlink(subname);
                    if (options.exclude_notification_paths.indexOf(subname) >= 0)
                        return notifyDown(subname);

                    if (ApplicationState._listeners[subname])
                        ApplicationState._listeners[subname].forEach(listener => send(listener, subname, name));

                    notifyDown(subname);
                }
            } else {
                const keys = Object.keys(obj);
                keys.forEach(key => {
                    const subname = name + "." + key;
                    notifySymlink(subname);
                    if (options.exclude_notification_paths.indexOf(subname) >= 0)
                        return notifyDown(subname);

                    if (ApplicationState._listeners[subname])
                        ApplicationState._listeners[subname].forEach((listener) => send(listener, subname, name));

                    notifyDown(subname);
                }
                )
            }
        }

        if (!explicit)
            notifyUp(name);

        notifyExplicit(name);

        if (!explicit)
            notifyDown(name);

    }

    /**
     * Revert changes to state for the specific name. Note: this honors the hierarchy, so it will navigate through all
     * child names and undo any changes below it. So, for example, if you were to call undo('app')  and 'app' was the top
     * level key in your application, any changes to any child of app will be rewound, 'app.login', 'app.user.role' etc...
     *
     * If there is no previous state for the specified value, it will be set to undefined.
     * @param name
     */
    static undo(name) {
        //this is just a regular key, no dotted path
        if (name.indexOf('.') < 0) {
            if (!ApplicationState._previousState[name])
                return ApplicationState._state[name] = undefined;
            ApplicationState._state[name] = ApplicationState._previousState[name].pop();
            return;
        }

        //we have a dotted name
        var names = name.split('.');
        for (let i = names.length; i > 0; i--) {
            name = names.slice(0, i).join('.');

            if (!ApplicationState._state[name]) continue;
            if (!ApplicationState._previousState[name])
                return ApplicationState._state[name] = undefined;
            ApplicationState._state[name] = ApplicationState._previousState[name].pop();
        }
    }

    /**
     * Allow for disabling notifications, in the case where application state needs to be modified without
     * triggering listeners
     */
    static disable_notfication() {
        ApplicationState._disable_notification = true;
    }

    /**
     * Reenable notifications
     */
    static enable_notification() {
        ApplicationState._disable_notification = false;
    }
    /**
     * Convert an object to a 2d array, where each element is [key,value]. Key is the full dotted path.
     * @param obj
     * @param path
     * @param flattened
     * @return object object containing keys and values of the flattened object
     */
    static flatten(obj, path, flattened) {
        if (!flattened) flattened = [];
        if (!path) path = "";

        // convert to a dotted path
        let keys = Object.keys(obj);
        let is_array = Array.isArray(obj);
        for (let i = 0; i < keys.length; i++) {
            let value = obj[keys[i]];
            let new_path;

            if (is_array) {
                new_path = path + (path ? "[" + keys[i] + "]" : "");
            } else {
                new_path = path + (path ? "." : "") + keys[i];
            }

            if (value && (typeof value === 'object')) {
                this.flatten(value, new_path, flattened);
                continue;
            }

            value = JSON.stringify(value);
            if (!value) value = JSON.stringify(null);
            flattened.push({ key: new_path, value: value });
        }

        return flattened;
    };

    static walk(reference) {
        let start_index = 0;
        let end_index;
        let ref;
        let path;
        let type;
        let parent_ref;
        let parent_path;
        let parent_type;

        const nodes = [];

        if (reference[0] === "[") {
            throw Error("Root node cannot be an array");
        }

        const evaluateParentPath = (name, path, type) => {
            let parent_path;
            if (!path) {
                return "";
            }

            if (type === "array") {
                parent_path = path.replace("[" + name + "]", "");
            } else {
                parent_path = path.replace("." + name, "");
            }

            return parent_path;
        };

        for (end_index = 0; end_index < reference.length; end_index++) {
            // We don't want to try to process if the indexes match
            if (start_index === end_index) continue;

            if (reference[start_index] === "." ||
                reference[start_index] === "[" ||
                reference[start_index] === "]"
            ) {
                start_index++;
            }

            if (reference[end_index] === ".") {
                ref = reference.substring(start_index, end_index);
                path = reference.substring(0, end_index);
                start_index = end_index + 1;
                type = "object";

                nodes.push({
                    name: ref,
                    path: path,
                    parent: parent_ref,
                    parent_path: evaluateParentPath(ref, path, parent_type),
                    parent_type: parent_type,
                    type: type
                });

                parent_ref = ref;
                parent_type = type;

                continue;
            }

            if (reference[end_index] === "[") {
                ref = reference.substring(start_index, end_index);
                path = reference.substring(0, end_index);
                start_index = end_index + 1;
                type = "array";

                nodes.push({
                    name: ref,
                    path: path,
                    parent: parent_ref,
                    parent_path: evaluateParentPath(ref, path, parent_type),
                    parent_type: parent_type,
                    type: type
                });

                parent_ref = ref;
                parent_type = type;

                continue;
            }

            if (reference[end_index] === "]") {
                ref = reference.substring(start_index, end_index);
                path = reference.substring(0, end_index + 1);

                // This is the end of the string
                if (end_index + 1 === reference.length) {
                    nodes.push({
                        name: parseInt(ref),
                        path: path,
                        parent: parent_ref,
                        parent_path: evaluateParentPath(ref, path, parent_type),
                        parent_type: parent_type,
                        type: "leaf"
                    });

                    parent_ref = ref;

                    return nodes;
                } else {
                    type = reference[end_index + 1] === "[" ? "array" : "object";
                    nodes.push({
                        name: parseInt(ref),
                        path: path,
                        parent: parent_ref,
                        parent_path: evaluateParentPath(ref, path, parent_type),
                        parent_type: parent_type,
                        type: type
                    });

                    parent_ref = ref;
                    parent_type = type;
                }

                start_index = end_index + 1;
            }
        }

        // we've made it all the way through, don't do a final yield
        if (start_index === end_index + 1) return nodes;

        nodes.push({
            name: reference.substring(start_index),
            path: reference,
            parent: parent_ref,
            parent_path: evaluateParentPath(reference, path, parent_type),
            parent_type: parent_type,
            type: "leaf"
        });

        return nodes;
    }
}

//my kingdom for static class property initializers. :-(
ApplicationState._previousState = {};
ApplicationState._state = {};
ApplicationState._listeners = [];
ApplicationState._listenerKey = 0;
ApplicationState._options = {};

export default ApplicationState;

