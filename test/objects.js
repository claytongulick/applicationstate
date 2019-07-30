const expect = chai.expect;

describe('Working with Objects', function () {
    it('should get and set a simple object', function () {
        const test_value = { a: 1, b: 2, c: 3 };

        ApplicationState.set('test_object', test_value);
        const retrieved_value = ApplicationState.get('test_object');

        expect(retrieved_value.a).to.equal(test_value.a);
    });

    it('should get a value from an object', function () {
        const test_value = { a: 1, b: 2, c: 3 };

        ApplicationState.set('test_object', test_value);
        const retrieved_value = ApplicationState.get('test_object.a');

        expect(retrieved_value).to.equal(test_value.a);
    });

    it('should set an element of an object using a string reference', function () {
        const test_value = { a: 1, b: 2, c: 3 };

        ApplicationState.set('test_object', test_value);
        const retrieved_value = ApplicationState.get('test_object.a');

        expect(retrieved_value).to.equal(test_value.a);

        ApplicationState.set('test_object.a', test_value.b);
        const changed_value = ApplicationState.get('test_object.a');

        expect(changed_value).to.equal(test_value.b);
    });

    it('should deal with the foolish notion of objects with all numeric keys', function () {
        const test_value = { 1: 1, 2: 2, 3: 3 }; // GOD don't do this, but if you are forced into it I guess...

        ApplicationState.set('dumb_object', test_value);
        const retrieved_value_1 = ApplicationState.get('dumb_object.2');
        expect(retrieved_value_1).to.equal(test_value[2]);

        ApplicationState.set('dumb_object.2', test_value[1]);
        const retrieved_value_2 = ApplicationState.get('dumb_object.2');

        expect(retrieved_value_2).to.equal(test_value[1]);
    });
});