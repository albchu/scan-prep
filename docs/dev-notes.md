# Performance Improvements
- UI should have a map of frame IDs to the frame results instead of an array. Less traverse, quicker access for updating frame rotations
- The main thread could track its own copy of image store state. Perhaps make the shapes identical and share a code between the current image store and this new image store.
