import ApplicationState from '../src/application_state';
import { expect } from "chai";

window.ApplicationState = ApplicationState;
window.expect = expect;

// tests
import './flatten.spec';
import './walk.spec';
import './basic.spec';
import './objects.spec';
import './arrays.spec';
import './notifications.spec';
import './plugins/localstorage/state-loader.spec';
import './plugins/localstorage/state-persistence.spec';

// Ignore if this is IE
import './plugins/indexeddb/state-loader.spec';
import './plugins/indexeddb/state-persistence.spec';