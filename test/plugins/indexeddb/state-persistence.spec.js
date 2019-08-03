import Dexie from "dexie";
import { StateLoader, StatePersistence, init } from "../../../plugins/indexeddb";
import ApplicationState from "../../../src/application_state";

if (!expect) var expect = chai.expect;

if (navigator && navigator.appName !== 'Microsoft Internet Explorer') {
    init(ApplicationState);

    let dexie;

    describe('Indexeddb Plugin StatePersistence', function () {
        before(function () {
            Dexie.delete('test_db_a');

            dexie = new Dexie('test_db_a');

            dexie.version(1).stores(
                {
                    application_state: 'key'
                }
            );

            new StatePersistence('test_db_a');
        });

        after(function () {
            return dexie.close();
        });

        it('should write a simple value to indexeddb that can be read by Dexie', async function () {
            await StateLoader.load('test_db_a');

            ApplicationState.set("app.test_1", "test_1");

            await sleep(10);

            const result = await dexie.application_state.where({ 'key': 'test_1' }).toArray();

            const item = result[0];
            expect(item).to.exist;
            expect(item.key).to.equal('test_1');
            expect(item.value).to.equal('"test_1"');

            return true;
        });

        it('should write a complex value to indexeddb that can be read by Dexie', async function () {
            this.timeout(5000);
            await StateLoader.load('test_db_a');

            ApplicationState.set("app.sub.doc.test_1", "test_1");

            await sleep(10);

            const result = await dexie.application_state.where({ 'key': 'sub.doc.test_1' }).toArray();

            const item = result[0];
            expect(item).to.exist;
            expect(item.key).to.equal('sub.doc.test_1');
            expect(item.value).to.equal('"test_1"');

            return true;
        });

        it('should write an array value to indexeddb', async function () {
            this.timeout(5000);
            await StateLoader.load('test_db_a');
            ApplicationState.set("app.a.list", [{ "thing": "test" }]);

            await sleep(10);

            const result = await dexie.application_state.where({ 'key': 'a.list[0].thing' }).toArray();
            expect(result[0]).to.exist;
            expect(result[0].key).to.equal("a.list[0].thing");
            expect(result[0].value).to.equal('"test"');

            return true;
        });
    });

    const sleep = (time) => {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, time);
        });
    }
}