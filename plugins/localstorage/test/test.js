import { StateLoader, StatePersistence, init } from "../index";
import ApplicationState from '../../../index';

window.ApplicationState = ApplicationState;
window.StateLoader = StateLoader;
window.StatePersistence = StatePersistence;

init(ApplicationState);

// tests
import './state-loader';
import './state-persistence';