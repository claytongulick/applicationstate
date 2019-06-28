import ApplicationState from '../../../index';
import StatePersistence from '../src/persistence';
import StateLoader from '../src/loader';
import Dexie from 'dexie'

window.Dexie = Dexie;
window.ApplicationState = ApplicationState;
window.StateLoader = StateLoader;
window.StatePersistence = StatePersistence;

// tests
import './state-loader';
import './state-persistence';