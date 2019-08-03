import ApplicationState from "../src/application_state";

if (!expect) var expect = chai.expect;

describe('Flatten function', function () {
    it('should properly deference a complex object including arrays', function () {
        const obj = {
            a: {
                a1: 1,
                a2: "2",
                a3: { a3a: 3 }
            },
            b: [0, 1],
            c: [
                { a: 1 },
                { b: 2 },
                { c: 3 }
            ]
        }

        const flattened = ApplicationState.flatten(obj, "");

        expect(flattened[0].key).to.equal('a.a1');
        expect(flattened[0].value).to.equal('1');
        expect(flattened[1].key).to.equal('a.a2');
        expect(flattened[1].value).to.equal('"2"');
        expect(flattened[2].key).to.equal('a.a3.a3a');
        expect(flattened[2].value).to.equal('3');
        expect(flattened[3].key).to.equal('b[0]');
        expect(flattened[3].value).to.equal('0');
        expect(flattened[4].key).to.equal('b[1]');
        expect(flattened[4].value).to.equal('1');
        expect(flattened[5].key).to.equal('c[0].a');
        expect(flattened[5].value).to.equal('1');
        expect(flattened[6].key).to.equal('c[1].b');
        expect(flattened[6].value).to.equal('2');
        expect(flattened[7].key).to.equal('c[2].c');
        expect(flattened[7].value).to.equal('3');
    });
});
