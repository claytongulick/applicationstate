const ApplicationState = require('../src/application_state');
const { expect } = require("chai");

window.ApplicationState = ApplicationState;
window.expect = expect;

// tests
import './flatten.spec';
import './walk.spec';
import './basic.spec';
import './objects.spec';
import './arrays.spec';
import './notifications.spec';