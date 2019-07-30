const expect = chai.expect;

describe('Working with Arrays', function () {
    it('should get and set a simple array', function () {
        const test_value = [1, 2, 3];

        ApplicationState.set('app.test_array', test_value);
        const retrieved_value = ApplicationState.get('app.test_array');

        expect(retrieved_value, "values are not the same").to.equal(test_value);
    });

    it('should get the first element from an array', function () {
        const test_value = [1, 2, 3];

        ApplicationState.set('app.test_array', test_value);
        const retrieved_value = ApplicationState.get('app.test_array[0]');

        expect(retrieved_value, "the array element 0 does not exist").to.exist;
        expect(retrieved_value, "the array element has the wrong value").to.equal(test_value[0]);
    });

    it('should set the first element of an array using a string reference', function () {
        const test_value = [1, 2, 3];

        ApplicationState.set('app.test_array', test_value);
        const retrieved_value = ApplicationState.get('app.test_array[0]');

        expect(retrieved_value, "the array element 0 does not exist").to.exist;
        expect(retrieved_value, "the array element 0 has the wrong value").to.equal(test_value[0]);

        ApplicationState.set('app.test_array[0]', test_value[1]);
        const changed_value = ApplicationState.get('app.test_array[0]');

        expect(changed_value, "the array element 0 does not exist").to.exist;
        expect(changed_value).to.equal(test_value[1]);
    });
});