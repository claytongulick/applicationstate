import ApplicationState from "../src/application_state";

if (!expect) var expect = chai.expect;

describe('Basic', function () {
    it('should set and get numeric values', function () {
        const test_value = 123;

        ApplicationState.set('test_number', test_value);
        const retrieved_value = ApplicationState.get('test_number');

        expect(retrieved_value).to.equal(test_value);
    });

    it('should set and get string values', function () {
        const test_value = 'a string';

        ApplicationState.set('test_string', test_value);
        const retrieved_value = ApplicationState.get('test_string');

        expect(retrieved_value).to.equal(test_value);
    });

    it('should set and get boolean values', function () {
        const test_value_1 = false;
        const test_value_2 = true;

        ApplicationState.set('test_boolean_1', test_value_1);
        ApplicationState.set('test_boolean_2', test_value_2);
        const retrieved_value_1 = ApplicationState.get('test_boolean_1');
        const retrieved_value_2 = ApplicationState.get('test_boolean_2');

        expect(test_value_1).to.equal(retrieved_value_1);
        expect(test_value_2).to.equal(retrieved_value_2);
    });

    it('should set and get null values', function () {
        const test_value = null;

        ApplicationState.set('test_null', test_value);
        const retrieved_value = ApplicationState.get('test_null');

        expect(retrieved_value).to.be.null;
    });

    it('should handle undefined values', function () {
        ApplicationState.set('test_undefined', undefined);
        const retrieved_value = ApplicationState.get('test_undefined');

        expect(retrieved_value).to.be.undefined;
    });

    it("should remove an existing value", function () {
        ApplicationState.set("app.test_1", 123);

        expect(ApplicationState.get("app.test_1")).to.equal(123);

        ApplicationState.rm("app.test_1");

        expect(ApplicationState.get("app.test_1")).to.not.exist;
    });

    it("should remove a value based on a deep reference", function () {
        ApplicationState.set("app.test_2", {
            child: {
                child_child: {
                    test: 123
                }
            }
        });

        expect(ApplicationState.get("app.test_2.child.child_child.test")).to.equal(123);

        ApplicationState.rm("app.test_2.child.child_child");

        expect(ApplicationState.get("app.test_2.child.child_child.test")).to.not.exist;
    });

    it("should remove an element from an array", function () {
        ApplicationState.set("app.list", ["a", "b", "c"]);

        expect(ApplicationState.get("app.list[1]")).to.equal("b");

        ApplicationState.rm("app.list[1]");

        expect(ApplicationState.get("app.list[1]")).to.equal("c");
    });
});