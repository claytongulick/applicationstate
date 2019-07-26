import Dexie from "dexie";
import { StateLoader, StatePersistence } from "../index";

const expect = chai.expect;
let dexie;

describe('StatePersistence', function () {
    beforeEach(function () {
        Dexie.delete('test_db_a');

        dexie = new Dexie('test_db_a');

        dexie.version(1).stores(
            {
                application_state: 'key'
            }
        );

        new StatePersistence('test_db_a');
    });

    it('should write a simple value to indexeddb that can be read by Dexie', function (done) {
        StateLoader.load('test_db_a').then(function () {

            ApplicationState.set("app.test_1", "test_1");

            // Delay and wait for state to perportedly be written.
            setTimeout(async function () {
                const result = await dexie.application_state.where({ 'key': 'test_1' }).toArray();

                const item = result[0];
                expect(item).to.exist;
                expect(item.key).to.equal('test_1');
                expect(item.value).to.equal('"test_1"');

                await dexie.close();
                done();
            }, 10);
        });
    });

    it('should write a complex value to indexeddb that can be read by Dexie', function (done) {
        StateLoader.load('test_db_a').then(function () {

            ApplicationState.set("app.sub.doc.test_1", "test_1");

            // Delay and wait for state to perportedly be written.
            setTimeout(async function () {
                const result = await dexie.application_state.where({ 'key': 'sub.doc.test_1' }).toArray();

                const item = result[0];
                expect(item).to.exist;
                expect(item.key).to.equal('sub.doc.test_1');
                expect(item.value).to.equal('"test_1"');

                await dexie.close();
                done();
            }, 10);
        });
    });

    it('should write an array value to indexeddb', function () {
        StateLoader.load('test_db_a').then(function () {
            ApplicationState.set("app.a.list", [{ "thing": "test" }]);

            setTimeout(async function () {
                const result = await dexie.application_state.where({ 'key': 'a.list[0].thing' }).toArray();
                expect(result[0]).to.exist;
                expect(result[0].key).to.equal("a.list[0].thing");
                expect(result[0].value).to.equal('"test"');
            }, 100);
        });
    });
});