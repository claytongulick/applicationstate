import ApplicationState from "../src/application_state";

if (!expect) var expect = chai.expect;

describe('Notifications', function () {
    it("should notify for a single node", function () {
        const listener_key = ApplicationState.listen("app.test_1", function (state, previous_state) {
            expect(state).to.exist;
            expect(previous_state).to.not.exist;
            expect(state).to.equal("test_1");
        });

        ApplicationState.set("app.test_1", "test_1");

        ApplicationState.removeListener("app.test_1", listener_key);
    });

    it("should notify for a single node with proper handling of previous state", function () {
        // Note, in this test, we implicitly test removing listeners, as they both call the same key.
        // If the listener above still existed, the tests there would fail.
        const listener_key = ApplicationState.listen("app.test_1", function (state, previous_state) {
            expect(state).to.exist;
            expect(previous_state).to.equal("test_1");
            expect(state).to.equal("test_2");
        });

        ApplicationState.set("app.test_1", "test_2");

        ApplicationState.removeListener("app.test_1", listener_key);
    });

    it("should notify for a parent node with proper handling of previous state", function () {
        let current_state, added_node, prev_state;
        const listener_key = ApplicationState.listen("app.test_2", function (state, previous_state) {
            expect(state).to.exist;
            if (prev_state) {
                // This portion of the test fails currently.
                // We need to decide what to do here. Do we populate up as well, or do we say "no history for this specific node".
                // The real problem is the performance hit we take when we have to populate all parent and child previous history entries.
                // We need to assess if that's really what we want to do.
                // expect(previous_state.child_node).to.equal(prev_state);
            } else {
                expect(previous_state).to.not.exist;
            }

            expect(typeof state).to.equal("object");
            expect(state.child_node).to.equal(current_state);
            expect(state.child_node_2).to.equal(added_node);
        });

        current_state = "test_2";
        ApplicationState.set("app.test_2.child_node", current_state);

        current_state = "test_2.1";
        prev_state = "test_2";
        ApplicationState.set("app.test_2.child_node", current_state);

        added_node = "test_2.2";
        ApplicationState.set("app.test_2.child_node_2", added_node);

        ApplicationState.removeListener("app.test_2", listener_key);
    });

    it("should notify for a child node", async function () {
        let current_state, prev_state, expected_count, actual_count = 0;

        const listener_key = ApplicationState.listen("app.test_3.child_node", async function (state, previous_state) {
            expect(state).to.exist;
            if (prev_state) {
                //
            } else {
                expect(previous_state).to.not.exist;
            }

            expect(typeof state).to.equal("string");
            expect(state).to.equal(current_state);

            actual_count++;
        });

        current_state = "test_3";
        await ApplicationState.set("app.test_3", {});
        expected_count = 1;
        await ApplicationState.set("app.test_3", {
            child_node: current_state
        });

        expect(expected_count).to.equal(actual_count);

        // This should not trigger a notification
        expected_count++;
        await ApplicationState.set("app.test_3.child_node_2", "test");
        expect(expected_count).to.not.equal(actual_count);

        ApplicationState.removeListener("app.test_3.child_node", listener_key);
    });

    it("should notify for a child of a child node", async function () {
        let current_state, expected_count, actual_count = 0;

        const listener_key = ApplicationState.listen(
            "app.test_4.child_node.child_child_node",
            async function (state, previous_state) {
                expect(state).to.exist;
                expect(state).to.equal(current_state);
                actual_count++;
            }
        );

        current_state = "test_4.0";
        expected_count = 0;

        await ApplicationState.set("app.test_4", {
            child_node: {}
        });

        // The listener should not have fired, since the node does not exist.
        expect(actual_count).to.equal(expected_count);

        await ApplicationState.set("app.test_4.child_node", { child_child_node: current_state });

        // The listener should have fired since the node was created.
        expected_count++;
        expect(actual_count).to.equal(expected_count);

        current_state = "test_4.1";
        await ApplicationState.set("app.test_4.child_node", {
            child_child_node: current_state
        });

        // Expect that that the child node will be notified since the parent changed.
        expected_count++;
        expect(actual_count).to.equal(expected_count);

        current_state = { test: 123 };
        await ApplicationState.set("app.test_4", {
            child_node: {
                child_child_node: current_state
            }
        });

        expected_count++
        expect(actual_count).to.equal(expected_count);

        ApplicationState.removeListener(
            "app.test_4.child_node.child_child_node",
            listener_key
        );
    });

    it("should notify the array node when an element is added, changed, or removed", async function () {
        let current_state, expected_count = 0, expected_length = 0, actual_count = 0;

        const listener_key = ApplicationState.listen(
            "app.list",
            async function (state, previous_state) {
                expect(state).to.exist;
                expect(state.length).to.equal(expected_length);
                expect(actual_count).to.equal(expected_count);
                actual_count++;
            }
        );

        current_state = [];
        await ApplicationState.set("app.list", current_state);

        expected_count++;
        expected_length++;

        await ApplicationState.set("app.list[0]", { test: 123 });

        expected_count++;

        await ApplicationState.set("app.list[0].test", 456);

        expected_count++;

        await ApplicationState.set("app.list[0].test_2", 123);

        expected_count++;
        expected_length++;

        await ApplicationState.set("app.list[1]", { test: 321 });

        expected_count++;
        expected_length++;

        await ApplicationState.set("app.list[2].test", 654);

        expected_count++;
        expected_length--;

        await ApplicationState.rm("app.list[2]");

        expected_count++;

        expect(actual_count).to.equal(expected_count);
    });
});