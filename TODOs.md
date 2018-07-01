
TODOs:

[ ] Set up the "view" specific code
    [ ] keyboard listeners
    [ ] renderer
    [ ] global view state
        - keyboard input state
        - gfx
        - "time"
        - paused/playing state


[ ] Basic prototype
    [ ] Load frame for character
    [ ] Load a few tile images
    [ ] Load map
    [ ] Simple loop
        [ ] Setting up directors
            [ ] Get user director to move PC
            [ ] Get AI director to move bot
        [ ] Setting up actors
            [ ] Get state machine working
        [ ] Inserting actors
            [ ] Based on map and user state, insert actor as necessary
        [ ] Deleting actors
            [ ] Based on "remove me" flag, remove them
            [ ] Set "remove me" once health <= 0
        [ ] Simple physics
        [ ] Simple rules
        [ ] End map condition
            [ ] User passes a line
        [ ] Triggers
            [ ] Remove boundary when last enemy in a section dies

[ ] Second prototype
    [ ] State change for presentation
        [ ] Loading
        [ ] Playing
        [ ] Ending level play
        [ ] play/pause
    [ ] Load new map when exiting current one
    [ ] Enemies
        [ ] Scripted to load when player is nearby
        [ ] Only load one at a time (i.e. can't trigger same entity more than once)
     [ ] Animata state transitions

