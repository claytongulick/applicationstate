import { StateLoader, setupLoader } from './src/loader.js';
import { StatePersistence, setupPersistence } from './src/persistence.js';

const init = async (app_state, db_name) => {
    setupLoader(app_state);
    setupPersistence(app_state);

    if (db_name) {
        new StatePersistence(db_name);
        return StateLoader.load(db_name);
    }

    return Promise.resolve();
}

export { StateLoader, StatePersistence, init }
export default { StateLoader, StatePersistence, init }
