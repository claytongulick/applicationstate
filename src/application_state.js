"use strict";
/**
 * This class maintains the overall application state in a platform-agnostic way.
 * Application states are key-value pairs, where the value is normally an object, but can be any serializable
 * data type.
 * A useful feature of this class is that all changes to the application state are stored, and can be restored via
 * a simple call to undo(name)
 *
 * @author Clay Gulick
 * 
 */
class ApplicationState {

    /**
     * Return the value for the specific state instance
     * @param name
     * @returns {*}
     */
    static get(name) {
        name = ApplicationState._dereferencePath(name);
        //console.log("Application state get:" + name);
        return ApplicationState._resolvePath(name);
    }

    /**
     * Register a callback for listening to changes to the state.
     * @param name
     * @param callback function Of the form callback(new_value, old_value) where value will be passed to the callback
     */
    static listen(name, callback) {
        if(!ApplicationState._listeners[name])
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
        if(!ApplicationState._listeners[name]) return;

        //forEach here is a a touch wasteful, but just double checking that all listeners for the key are removed
        //though there should only ever be one
        ApplicationState._listeners.forEach((listener,index) => {
            if(listener._listenerKey == key) {
                ApplicationState._listeners.splice(index,1);
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
        options = Object.assign(default_options,options);
        ApplicationState._options[name] = options;
        if(!ApplicationState._previousState[name] && options.save_previous)
            ApplicationState._previousState[name] = [];
        if(options.save_previous) {
            let previous_value = ApplicationState._resolvePath(name);
            if (!(typeof previous_value === 'undefined'))
                ApplicationState._previousState[name].push(previous_value);
        }
        ApplicationState._assignValue(name,value);
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

        if(path.indexOf('.') < 0)
            return object[path] = value;
        //TODO: check to see if we're assigning to leaf or subobject of an immutable object and fail if so --ccg
        var names = path.split('.');
        var key = names.pop();
        ApplicationState._ensurePath(path, object);
        var obj = ApplicationState._resolvePath(names,object);
        if(!(typeof obj == 'object')) return;
        return obj[key] = value;
    }

    /**
     * Similar to *nix ln command, this creates a "symlink" between nodes
     * Example: ApplicationState.ln('app.assessments.1234', 'app.current_assessment');
     * @param target string The path to the real, existing node that a link is being created for
     * @param link_path string The path to the new symlink
     */
    static ln(target, link_path) {
        if(!ApplicationState._symlinks)
            ApplicationState._symlinks = {};
        //this is an optimization to store backrefs from targeted nodes. It makes lookups for notifications fast
        if(!ApplicationState._reverse_symlinks)
            ApplicationState._reverse_symlinks = {};

        target = ApplicationState._dereferencePath(target);
        let parts = link_path.split('.');
        let leaf = parts.slice(-1);
        //dereference the parent path so that its materialized.
        let parent_path = ApplicationState._dereferencePath(parts.slice(0,-1).join('.'));
        link_path = parent_path + '.' + leaf;

        ApplicationState._symlinks[link_path] = target;
        if(!(ApplicationState._reverse_symlinks[target]))
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
        if(target === 'app')
            return;
        if(!target)
            return;

        target = ApplicationState._materializePath(target);

        function removeSymlink(target, keep_referrers) {
            let link_target = ApplicationState._symlinks[target];
            delete ApplicationState._symlinks[target];

            if(!keep_referrers) {
                let referrers = ApplicationState._reverse_symlinks[link_target];
                referrers.splice(referrers.indexOf(target), 1);
            }
        }

        function isSymlink(target) {
            return !!(ApplicationState._symlinks && ApplicationState._symlinks[target]);
        }

        function referredTo(target) {
            return !!(ApplicationState._reverse_symlinks[target]);
        }

        //first, check to see if this is a symlink. If so, just remove it from the symlink trackers
        if(isSymlink(target))
            return removeSymlink(target);

        if(referredTo(target))
            ApplicationState._reverse_symlinks[target]
                .forEach(
                    (symlink) => {
                        removeSymlink(target, true);
                    }
                );
        delete ApplicationState._reverse_symlinks[target];

        let parts = target.split('.');
        let leaf = parts.slice(-1);
        //strip off 'app' and the leaf
        parts = parts.slice(1,-1);
        for(let i=0; i < parts.length; i++) {
            object = object[parts[i]];
            if (typeof object === 'undefined')
                throw new Error('Undefined target in ApplicationState.rm: ' + target);
        }
        delete object[leaf];

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
        if(path == 'app')
            return path;
        if(!ApplicationState._symlinks)
            return path;

        let parts = path.split('.');

        for(let i=0; i<parts.length; i++) {
            let sub_path = parts.slice(0,i).join('.');
            if(!(ApplicationState._symlinks[sub_path]))
                continue;

            path = ApplicationState._symlinks[sub_path] + '.' + parts.slice(i).join('.');
            return ApplicationState._dereferencePath(path);
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
        if(path.indexOf('.') < 0) return [];
        let symlinks = [];
        let resolved_symlinks = [];

        function addParentSymlinks(path) {
            let parts = path.split('.');
            let leaf = parts.slice(-1);
            let parent_path = parts.slice(0,-1).join('.');
            let parent_symlinks = ApplicationState._reverseSymlink(parent_path);
            parent_symlinks.forEach(
                (symlink) => {
                    resolved_symlinks.push(symlink + "." + leaf);
                }
            )
        }

        if(ApplicationState._reverse_symlinks[path])
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
        let parent_path = ApplicationState._dereferencePath(parts.slice(0,-1).join('.'));
        return parent_path + '.' + leaf;
    }

    /**
     * Internal utility function to dereference dotted path to a specific object/value
     * @param path either a simple string key, a dotted string or an array that indicates the path
     * @param object Object optional object that can be substituted for use instead of ApplicationState._state
     * @private
     */
    static _resolvePath(path,object) {
        var names;
        object = object || ApplicationState._state;
        if(typeof path == 'string') {
            if(!(path.includes('.')))
                return object[path];

            names = path.split('.');
        }
        else
            names = path;
        for(let i=0; i < names.length; i++) {
            object = object[names[i]];
            if(typeof object === 'undefined') return undefined;
        }
        return object;
    }

    /**
     * Internal utility function to ensure the specified object path is valid. If keys are missing, they'll be
     * created
     * @param path
     * @param object Object optional object that can be substituted for use instead of ApplicationState._state
     * @private
     */
    static _ensurePath(path, object) {
        var names = path.split('.');
        var obj = object || ApplicationState._state;
        var i;
        var parts;
        var new_parts = [];

        //check the sub paths, rewinding from the end
        for(i=names.length - 1; i >= 0; i--) {
            parts = names.slice(0,i);
            obj = ApplicationState._resolvePath(parts, object);
            if(obj) break;
            new_parts.push(parts[parts.length - 1]);
        }

        //fast forward and create missing objects
        while(new_parts.length) {
            var new_part = new_parts.pop();
            obj[new_part] = {};
            obj=obj[new_part];
        }
    }

    /**
     * Triggers a notification, or 'get' of a value in the application state.
     * @param name
     * @param explicit Boolean indicate whether to notify up/down the hierarchy
     */
    static notify(name, explicit, options) {
        if(ApplicationState._disable_notification) return;

        /**
         * Send the actual notification.
         *
         * @param listener
         * @param name the place in the hierachy that's triggering the send
         * @param modified_name the name of the hierarchical key that was actually modified, may be different than `name`
         * @returns {*}
         */
        function send(listener,name, modified_name) {
            if(options.exclude_notification_listeners.includes(listener._listenerKey))
                return;

            name = ApplicationState._dereferencePath(name);
            if(ApplicationState._previousState[name])
                return listener(
                    ApplicationState._resolvePath(name),
                    ApplicationState._previousState[name][ApplicationState._previousState[name].length -1],
                    modified_name
                );
            //no previous state, set undefined
            listener(ApplicationState._resolvePath(name),undefined,modified_name);
        }

        /**
         * If there's a symlink that points to this path, invoke any listeners on the symlink
         * @param name
         */
        function notifySymlink(name) {
            if(!ApplicationState._symlinks)
                return;

            //if there's a symlink that refers to this path
            let symlinks = ApplicationState._reverseSymlink(name);
            //and there's a listener on that symlink, trigger that notification
            symlinks.forEach(
                symlink => {
                    if(!ApplicationState._listeners[symlink]) return;
                    if(options.exclude_notification_paths.includes(symlink)) return;

                    ApplicationState._listeners[symlink].forEach((listener) => {
                        send(listener,symlink);
                    });
                }
            );
        }

        //notify listeners up the hierarchy
        function notifyUp(name) {
            if(name.indexOf('.') < 0) return;
            let names = name.split('.');
            for(let i=names.length - 1; i > 0; i--) {
                let new_name = names.slice(0,i).join('.');
                notifySymlink(new_name);
                if(!ApplicationState._listeners[new_name]) continue;
                if(options.exclude_notification_paths.includes(new_name)) continue;

                ApplicationState._listeners[new_name].forEach((listener) => send(listener,new_name,name));
            }
        }

        //notify on an explicit name
        function notifyExplicit(name) {
            notifySymlink(name);

            if(!ApplicationState._listeners[name]) return;
            if(options.exclude_notification_paths.includes(name)) return;

            ApplicationState._listeners[name].forEach((listener) => {
                send(listener,name);
            });
        }

        //recursively notify down the hierarchy
        function notifyDown(name) {
            var obj = ApplicationState._resolvePath(name);
            if(!obj) return;
            if(!(typeof obj === 'object')) return;
            var keys = Object.keys(obj);
            keys.forEach(
                (key) => {
                    var subname = name + "." + key;
                    notifySymlink(subname);
                    if(options.exclude_notification_paths.includes(subname))
                        return notifyDown(subname);

                    if(ApplicationState._listeners[subname])
                        ApplicationState._listeners[subname].forEach((listener)=>send(listener,subname,name));
                    notifyDown(subname);
                }
            )
        }

        if(!explicit)
            notifyUp(name);

        notifyExplicit(name);

        if(!explicit)
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
        if(name.indexOf('.') < 0) {
            if(!ApplicationState._previousState[name])
                return ApplicationState._state[name]=undefined;
            ApplicationState._state[name] = ApplicationState._previousState[name].pop();
            return;
        }

        //we have a dotted name
        var names = name.split('.');
        for(let i=names.length; i > 0; i--) {
            name = names.slice(0,i).join('.');

            if(!ApplicationState._state[name]) continue;
            if(!ApplicationState._previousState[name])
                return ApplicationState._state[name]=undefined;
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
}

//my kingdom for static class property initializers. :-(
ApplicationState._previousState= {};
ApplicationState._state = {};
ApplicationState._listeners = [];
ApplicationState._listenerKey = 0;
ApplicationState._options = {};

export default ApplicationState;
