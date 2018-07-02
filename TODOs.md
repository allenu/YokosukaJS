
TODOs:

- [ ] Basic prototype
    - [x] Load frame for character
    - [x] Load a few tile images
    - [ ] Load map
          - [ ] Display billboards
    - [ ] Implement "system directions"
          - [ ] rules for when one character hits another
                - [ ] keep track of which actors are touching
          - [ ] apply physics to make them move

    - [x] Simple loop
        - [ ] Setting up directors
            - [ ] Get user director to move PC
            - [ ] Get AI director to move bot
        - [x] Setting up actors
            - [x] Get state machine working
        - [ ] Inserting actors
            - [ ] Based on map and user state, insert actor as necessary
        - [ ] Deleting actors
            - [ ] Based on "remove me" flag, remove them
            - [ ] Set "remove me" once health <= 0
        - [ ] Simple physics
        - [ ] Simple rules
        - [ ] End map condition
            - [ ] User passes a line
        - [ ] Triggers
            - [ ] Remove boundary when last enemy in a section dies

- [ ] Improvements
    - [ ] make spritesheet.json's images list a dictionary instead of array

- [ ] Second prototype
    - [ ] Load game map and actors from resources file
    - [ ] Load top-level description of which maps to load from resources file
    - [ ] State change for presentation
        - [ ] Loading
        - [ ] Playing
        - [ ] Ending level play
        - [ ] play/pause
    - [ ] Load new map when exiting current one
    - [ ] Enemies
        - [ ] Scripted to load when player is nearby
        - [ ] Only load one at a time (i.e. can't trigger same entity more than once)
     - [ ] Animata state transitions

- [x] Set up the "view" specific code
    - [x] keyboard listeners
    - [x] renderer
    - [x] global view state
        - keyboard input state
        - gfx
        - "time"
        - paused/playing state

