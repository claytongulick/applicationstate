const expect = chai.expect;

describe('Working with Arrays', () => {
    describe('Get and set', () => {
        it('should get and set a simple array', () => {
            const test_value = [1, 2, 3];

            ApplicationState.set('test_array', test_value);
            const retrieved_value = ApplicationState.get('test_array');

            expect(retrieved_value).to.equal(test_value);
        });
    });

    describe('Get dereferenced value', () => {
        it('should get the first element from an array', () => {
            const test_value = [1, 2, 3];

            ApplicationState.set('test_array', test_value);
            const retrieved_value = ApplicationState.get('test_array.[0]');

            expect(retrieved_value).to.equal(test_value[0]);
        });
    });

    describe('Set a dereferenced value', () => {
        it('should set the first element of an array using a string reference', () => {
            const test_value = [1, 2, 3];

            ApplicationState.set('test_array', test_value);
            const retrieved_value = ApplicationState.get('test_array.[0]');

            expect(retrieved_value).to.equal(test_value[0]);

            ApplicationState.set('test_array.[0]', test_value[1]);
            const changed_value = ApplicationState.get('test_array.[0]');

            expect(changed_value).to.equal(test_value[1]);
        });
    });
});