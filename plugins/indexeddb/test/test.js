import { StateLoader, StatePersistence, init } from "../index";
import ApplicationState from '../../../index';
import Dexie from 'dexie'

window.Dexie = Dexie;
window.ApplicationState = ApplicationState;
window.StateLoader = StateLoader;
window.StatePersistence = StatePersistence;

init(ApplicationState);

// tests
import './state-loader';
import './state-persistence';