import { StateLoader, StatePersistence, init } from "../index";

const expect = chai.expect;

describe('StatePersistence', function () {
    this.beforeAll(function () {
        localStorage.clear();
        new StatePersistence("test_db_a");
    });

    it('should write a simple value to localStorage', function () {
        StateLoader.load('test_db_a');
        ApplicationState.set("app.test_1", "test_1");

        const item = JSON.parse(localStorage['test_db_a']);

        expect(item).to.exist;
        expect(item["test_1"]).to.equal('"test_1"');
    });

    it('should write a complex value to localStorage', function () {
        StateLoader.load('test_db_a');
        ApplicationState.set("app.sub.doc.test_1", "test_1");

        const item = JSON.parse(localStorage['test_db_a']);

        expect(item).to.exist;
        expect(item['sub.doc.test_1']).to.equal('"test_1"');
    });

    it('should write an array value to localStorage', function () {
        StateLoader.load('test_db_a');
        ApplicationState.set("app.a.list", [{ "thing": "test" }]);

        const item = JSON.parse(localStorage['test_db_a']);

        expect(item).to.exist;
        expect(item["a.list[0].thing"]).to.equal('"test"');
    });
});