# Release Notes

## 0.2.2 (Future release)

- Moved back to using a JavaScript class with static methods.
- Addition of CircleCI builds.
- Adding in MkDocs based documentation.
- Addition of Krama as a test target.
- Consolidation of default plugin builds into one build.
- Consolidation of default plugin tests into the main suite.

## 0.2.1 (7/30/2019)

- Fixed bug where rm did not use new walk function.
- Added notification tests.

## 0.2.0 (7/26/2019)

- New reference syntax and better array handling.
- IE11 compatibility for the main library and the new localStorage plugin.
- Decoupling of the main library from the plugins with an init function that injects the library in at runtime.
- Added the indexeddb and localStorage plugins to the main repo.
- More comprehensive tests.
