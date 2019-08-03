import Dexie from "dexie";
import { StateLoader, StatePersistence, init } from "../../../plugins/indexeddb";
import ApplicationState from "../../../src/application_state";

if (!expect) var expect = chai.expect;

if (navigator && navigator.appName !== 'Microsoft Internet Explorer') {
    init(ApplicationState);

    let dexie;

    describe('Indexeddb Plugin StateLoader', function () {
        before(async function () {
            Dexie.delete('test_db_b');
            dexie = new Dexie('test_db_b');

            new StatePersistence('test_db_b');

            dexie.version(1).stores(
                {
                    application_state: 'key'
                }
            );

            await dexie.application_state
                .bulkPut([
                    { key: 'test_1', value: '"test_1"' },
                    { key: 'sub.doc.test_1', value: 'sub_doc_test_1' },
                    { key: 'a.list[0].thing', value: 'array_test_1' }
                ]);
        });

        after(async function () {
            return dexie.close();
        });

        it('should load a simple value after loading state', async function () {
            await StateLoader.load('test_db_b');

            const value = ApplicationState.get("app.test_1");
            expect(value, "value does not exist").to.exist;
            expect(value, "value is not correct").to.equal('test_1');
        });

        it('should load a complex value', async function () {
            await StateLoader.load('test_db_b');

            const value = ApplicationState.get("app.sub");
            expect(value, "sub node does not exist").to.exist;
            expect(value.doc, "sub.doc node does not exist").to.exist;
            expect(value.doc.test_1, "sub.doc.test_1 node does not exist").to.exist;
            expect(value.doc.test_1, "sob.doc.test_1 node value is wrong").to.equal('sub_doc_test_1');
        });

        it('should load an array value', async function () {
            await StateLoader.load('test_db_b');

            const value = ApplicationState.get("app.a");
            expect(value, "full object does not exist").to.exist;
            expect(value.list, "list array does not exist").to.exist;
            expect(Array.isArray(value.list), "list is an array").to.be.true;
            expect(value.list[0], "list array does not have a 0 index").to.exist;
            expect(value.list[0].thing, "list array does not have a thing object or the value is wrong").to.equal('array_test_1');
        });
    });
}