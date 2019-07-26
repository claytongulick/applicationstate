import { StateLoader, setupLoader } from './src/loader.js';
import { StatePersistence, setupPersistence } from './src/persistence.js';

const init = async (app_state, options) => {
    setupLoader(app_state);
    setupPersistence(app_state);
}

export { StateLoader, StatePersistence, init }
export default { StateLoader, StatePersistence, init }
