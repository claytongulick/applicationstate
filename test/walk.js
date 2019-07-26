import ApplicationState from "../src/application_state";

const expect = chai.expect;

describe('Walk function', function () {
    it('should walk through and return proper meta-data for a reference with only objects', function () {
        const reference = "a.bb.c.d.e";
        const ref_array = reference.split('.');

        const nodes = ApplicationState.walk(reference);

        let index;
        for (index = 0; index < nodes.length; index++) {
            const result = nodes[index];
            expect(result.name, "name " + ref_array[index] + " should exist").to.exist;
            expect(result.name, "name does not match " + ref_array[index]).to.equal(ref_array[index]);

            if (index < 4) {
                expect(result.type, "should be an object, but does not exist").to.exist;
                expect(result.type, 'should equal "object"').to.equal("object");
            } else {
                expect(result.type, "should be an object, but does not exist").to.exist;
                expect(result.type, "should equal \"leaf\"").to.equal("leaf");
            }
        }

        expect(index, "should have iterated 5 times").to.equal(5);
    });

    it('should walk through and return proper meta-data for a reference with objects and arrays', function () {
        const reference = "a.bb.c[0].d.e";
        const ref_array = ['a', 'bb', 'c', 0, 'd', 'e'];

        let nodes = ApplicationState.walk(reference);

        let index, result;
        for (index = 0; index < nodes.length; index++) {
            result = nodes[index];
            expect(result.name, "name " + ref_array[index] + " should exist").to.exist;
            expect(result.name, "name does not match " + ref_array[index]).to.equal(ref_array[index]);

            if (index === 2) {
                expect(result.type, "should be an array, but does not exist").to.exist;
                expect(result.type, "should equal object").to.equal("array");
            } else if (index === 3) {
                expect(result.type, "should be an object, but does not exist").to.exist;
                expect(result.type, index + " should equal object").to.equal("object");
            } else if (index < 5) {
                expect(result.name.indexOf('['), "should not contain any array syntax").to.be.lessThan(0);
                expect(result.type, "should be an object, but does not exist").to.exist;
                expect(result.type, index + " should equal \"object\"").to.equal("object");
            } else {
                expect(result.type, "should be an object, but does not exist").to.exist;
                expect(result.type, index + " should equal \"leaf\"").to.equal("leaf");
            }
        }

        expect(index, "should have iterated 6 times").to.equal(6);
    });

    it('should walk through and return proper meta-data for a reference with an array at the end', function () {
        const reference = "a.b.c.d.e[0]";
        const ref_array = ["a", "b", "c", "d", "e", 0];

        let nodes = ApplicationState.walk(reference);

        let index, result;
        for (index = 0; index < nodes.length; index++) {
            result = nodes[index];
            expect(result.name, "name " + ref_array[index] + " should exist").to.exist;
            expect(result.name, "name does not match " + ref_array[index]).to.equal(ref_array[index]);

            if (index < 4) {
                expect(result.name.indexOf('['), "should not include array syntax").to.be.lessThan(0);
                expect(result.type, "should be an object, but does not exist").to.exist;
                expect(result.type, "should equal \"object\"").to.equal("object");
            } else if (index === 4) {
                expect(result.type, "should be an array, but does not exist").to.exist;
                expect(result.type, "should equal \"array\"").to.equal("array");
            } else {
                expect(result.path, "should be \"a.b.c.d.e[0]\"").to.equal("a.b.c.d.e[0]");
                expect(result.parent_path, "should be \"a.b.c.d.e\"").to.equal("a.b.c.d.e");
                expect(result.type, "should be an object, but does not exist").to.exist;
                expect(result.type, "should equal \"leaf\"").to.equal("leaf");
            }
        }

        expect(index, "should have iterated 6 times").to.equal(6);
    });

    it('should walk through and return proper meta-data for a reference with an array within an array', function () {
        const reference = "a.bb.c[0][0].dd.e";
        const ref_array = ['a', 'bb', 'c', 0, 0, 'dd', 'e'];

        let nodes = ApplicationState.walk(reference);

        let index;
        for (index = 0; index < nodes.length; index++) {
            const result = nodes[index];
            expect(result.name, "name " + ref_array[index] + " should exist").to.exist;
            expect(result.name, "name does not match " + ref_array[index]).to.equal(ref_array[index]);

            if (index === 2) {
                expect(result.path, "should be \"a.bb.c\"").to.equal("a.bb.c");
                expect(result.parent_path, "should be \"a.bb\"").to.equal("a.bb");
                expect(result.type, "should be an array, but does not exist").to.exist;
                expect(result.type, index + " should equal array").to.equal("array");
            } else if (index === 3) {
                expect(result.path, "should be \"a.bb.c[0]\"").to.equal("a.bb.c[0]");
                expect(result.parent_path, "should be \"a.bb.c\"").to.equal("a.bb.c");
                expect(result.type, "should be an array, but does not exist").to.exist;
                expect(result.type, index + " should equal array").to.equal("array");
            } else if (index < 6) {
                expect(result.type, "should be an object, but does not exist").to.exist;
                expect(result.type, index + " should equal \"object\"").to.equal("object");
            } else {
                expect(result.path, "should be \"a.bb.c[0][0].dd.e\"").to.equal("a.bb.c[0][0].dd.e");
                expect(result.parent_path, "should be \"a.bb.c[0][0].dd\"").to.equal("a.bb.c[0][0].dd");
                expect(result.type, "should be an object, but does not exist").to.exist;
                expect(result.type, index + " should equal \"leaf\"").to.equal("leaf");
            }
        }

        expect(index, "should have iterated 7 times").to.equal(7);
    });

    it("should gracefully handle greater than single digit numbers", function () {
        const reference = "app.aa[10]";
        const ref_array = ["app", "aa", 10];

        let nodes = ApplicationState.walk(reference);

        for (let index = 0; index < nodes.length; index++) {
            const result = nodes[index];
            expect(result.name, "name " + ref_array[index]).to.exist;
            expect(result.name, index + " should equal " + ref_array[index]).to.equal(ref_array[index]);
            expect(result.type, index + " should exist");

            switch (index) {
                case 0:
                    expect(result.type, "type should be object").to.equal("object");
                    expect(result.parent_type, "type to be undefined").to.be.undefined;
                    break;
                case 1:
                    expect(result.type, "type should be object").to.equal("array");
                    expect(result.parent_type, "type to be object").to.equal("object");
                    break;
                case 2:
                    expect(result.type, "type should be object").to.equal("leaf");
                    expect(result.parent_type, "type to be object").to.equal("array");
                    break;
            }
        }
    });

    it("should throw a fit if you try to make the root node an array", function () {
        const reference = "[10]";

        try {
            const nodes = ApplicationState.walk(reference);
            throw "Should have thrown an error."
        } catch (e) {
            return;
        }
    });
});
