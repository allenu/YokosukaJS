
TODOs:

- [ ] Basic prototype
    - [x] Load frame for character
    - [x] Load a few tile images
    - [x] Load map
          - [x] Display billboards
    - [x] Implement "system directions"
          - [x] rules for when one character hits another
                - [x] keep track of which actors are touching
          - [x] apply physics to make them move
    - [x] Move director code to own functions

    - [x] Update camera state

    - [x] Simple loop
        - [x] Setting up directors
            - [x] Get user director to move PC
            - [x] Get AI director to move bot
        - [x] Setting up actors
            - [x] Get state machine working
        - [x] Inserting actors
            - [x] Based on map and user state, insert actor as necessary
        - [x] Deleting actors
            - [x] Based on "remove me" flag, remove them
            - [x] Set "remove me" once health <= 0
        - [x] Simple physics
        - [x] Simple rules
        - [x] Move camera around
            - [x] Disallow camera from going out of bounds
                - [x] determine min_x and max_x from boundary and boundaries
                    - [x] if max_x - min_x <= camera_width, then center camera
                    - [x] always gradually move camera, so if a boundary disappears, slowly move camera
                          to new position. 
                        - [x] have a camera target_x that it's always moving to, but camera movement is limited per frame
                        - [x] generally, target_x will be where player's position.x is, but could be limited by bounds
        - [x] Show health bar
            - [x] show player's health
            - [x] animate energy change over time
        - [ ] handle coordinating directors
            - [ ] only one attacker at a time
            - [ ] enemies take turns attacking
            - [ ] all enemies stand at a distance, except for one
        - [ ] End map condition
            - [ ] User passes a line
            - [ ] User dies
            - [ ] Run script command to transition to another screen or display text and pause game state (?)
        - [x] Triggers
            - [x] Fire trigger when actor is removed
                  - [x] add 'remove' property to animation frame to signal removal
                  - [x] add system rule where if health <= 0 and we can interrupt the state, force it to dying animation
                        where last frame of dying has 'remove' property
                  - [x] when 'remove' happens, trigger the event
            - [x] Remove boundary when last enemy in a section dies

- [ ] Improvements
    - [ ] add web audio
    - [ ] add "reset" button to demo
    - [ ] actors should be dictionary and not array
    - [ ] Generalize the properties in the animation frames
          - instead of using the 'remove' property, add trigger properties that can be used to fire triggers/scripts
    - [ ] Have triggers that can fire multiple times and some that only fire once
    - [ ] Allow for multiple trigger criteria (i.e. don't use trigger id for triggers as a unique key in the list)
    - [ ] make spritesheet.json's images list a dictionary instead of array
    - [ ] Support coordinated directors, where they share information and can coordinate attacks
    - [ ] resilience
          - [ ] display ugly icon when image missing

- [ ] Second prototype
    - [x] Load game map and actors from resources file
    - [ ] show health of actor player is "interacting" with
        - [ ] define interaction as
            - whoever you've attacked last
            - whoever is attacking you
            - whoever you are nearest
            - expires with flashing over course of 2s when enemy dies
            - expires after none of the above, after 5s
    - [ ] Implement actors (items) that can be picked up
          * touched by pc once
          * disappears on touch
          * runs script on touch (boost hp)
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

