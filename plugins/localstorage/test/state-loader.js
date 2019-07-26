import { StateLoader, StatePersistence } from "..";

const expect = chai.expect;

describe('StateLoader', function () {
    beforeEach(function () {
        const state = {
            "test_1": "test_1",
            "sub.doc.test_1": "sub_doc_test_1",
            "a.list[0].thing": "array_test_1"
        }

        localStorage['test_db_b'] = JSON.stringify(state);
    });

    it('should load a simple value after loading state', function () {
        StateLoader.load('test_db_b');

        const value = ApplicationState.get("app.test_1");
        expect(value, "value does not exist").to.exist;
        expect(value, "value is not correct").to.equal('test_1');
    });

    it('should load a complex value', function () {
        StateLoader.load('test_db_b');

        const value = ApplicationState.get("app.sub");
        expect(value, "sub node does not exist").to.exist;
        expect(value.doc, "sub.doc node does not exist").to.exist;
        expect(value.doc.test_1, "sub.doc.test_1 node does not exist").to.exist;
        expect(value.doc.test_1, "sob.doc.test_1 node value is wrong").to.equal('sub_doc_test_1');
    });

    it('should load an array value', function () {
        StateLoader.load('test_db_b');

        const value = ApplicationState.get("app.a");
        expect(value, "full object does not exist").to.exist;
        expect(value.list, "list array does not exist").to.exist;
        expect(Array.isArray(value.list), "list is an array").to.be.true;
        expect(value.list[0], "list array does not have a 0 index").to.exist;
        expect(value.list[0].thing, "list array does not have a thing object or the value is wrong").to.equal('array_test_1');
    });
});