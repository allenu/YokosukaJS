
TODOs:

# Next major update

- [ ] More refactor work
    - [ ] Set up two examples to test against
        - [ ] side scroller example
        - [ ] overhead example

    - [ ] support multiple commands in scripts
        - [x] allow a separate "commands:" field if there is more than one
        - [ ] sender_id should be set for all commands...
            - [ ] Or should it ... ??

    - [x] DESIGN BUG: currently, it's not possible to run a given script multiple times if the criteria matches multiple signals.
        - i.e. if two actors send the "disable_sender" signal on a frame, it will only get called once, on the first actor that
          matches the criteria.
        - [x] Make it so that each signal is tested against all scripts. That is, have an outer loop that goes through all signals
              and an inner loop that matches against scripts, instead of what we have now (an outer loop that goes through all
              scripts and an inner loop that matches the *first* signal).
              - This gets super complicated, however, if we have multiple signal predicates on a script... if a script depends on
                signals A and B, we only want it to run once if A and B are true. We don't want it to execute on B and A as well...
              - Possible solution: only test multiple signals on *repeatable* scripts that have only one predicate where the
                predicate is generic (ex: sender_type: actor). Possibly just call it a wildcard script instead of repeatable...
                If it's a wildcard it means it can match multiple signals at any time, so it's inherently repeatable.
                - Code could look like this:
                  - separate scripts into those that are wildcards and those that are not
                  - treat non-wildcard scripts as before: go through each and see if predicate matches based on signals provided
                  - then, for each wildcard script, 
                    - for each signal, see if it matches the predicate, if so, execute those commands for this sender_id
                - call it 'multimatch' signal instead of wildcard
              - Another solution: get rid of the idea of multiple signals matching a script... it's only useful at the moment
                for the disable_sender case... Are there other scenarios where we could find it useful to fire script commands
                multiple times?
                - we could encode special effects via scripts... we could, for instance, create a billboard where an actor
                  is based on a signal given off by a particular animation frame...
                - we may also send out multiple future signals (with different senders) and want to make sure they all
                  execute the same script and not just have it run once
              - Some other special cases that are more system cases:
                - if two or more actors send a "grunt" signal, we'd like to play the sound effect multiples if they are unique
                  sound effects for each actor.
                - only shake ground once even if multiple "hit the ground" signals are sent by multiple actors

    - [x] Clean up the common code at start of f_State()
    - [ ] separate actor position from actor animation state frames etc. the physics system is separate.

    - [ ] Move script code outside of f_State
    - [ ] Move all invariants to state.invariants ?
        - The idea is that all else goes into state.variants. So actor states is a combination of invariant + variant properties
        - Triggers that fire are all in variants, as well as scripts that have executed over time.

- [ ] Improvements
    - [ ] add web audio
        - [ ] On hurt animation

    - [ ] Add text display commands
        - [ ] https://www.w3schools.com/graphics/canvas_text.asp
        - [ ] add a border https://www.w3schools.com/tags/canvas_fillrect.asp
    - [ ] Add simple transition animations (commands)
        - [ ] Enable/Disable a billboard
        - [ ] Fade in/fade out a billboard
        - [ ] Move a billboard from one location to another, over a given period of time
        - [ ] Send signal when animations done
    - [ ] handle coordinating directors
        - [ ] only one attacker at a time
        - [ ] enemies take turns attacking
        - [ ] all enemies stand at a distance, except for one
    - [ ] End map condition
        - [ ] User passes a line
        - [ ] User dies
        - [ ] Run script command to transition to another screen or display text and pause game state (?)
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
    - [ ] Dialog box

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

- [x] Refactor work
    - [x] Move top-level driver to its own file
        - has Tick()
        - has StartGame()
    - [x] Move renderer part to its own file
    - [x] Move directors to own file
    - [x] break out health stuff to own state? (separate it from actor?)
    - [x] move trigger code to own state func

- [x] Add UI-level billboards
    - [x] add a flag that says these are drawn on the UI level
    - [x] position is relative to top-left of screen

- [ ] display version number in demo

- [ ] Documentation
    - [ ] Formalize how you specify signal predicates in scripts
        - must always have signal.id
        - optional signal.sender_type to limit the type of sender, can be 'actor' for now
        - optional signal.sender_id to limit WHO the sender can be
    - [ ] Formalize how triggers work
        - they only fire once (but maybe allow a command to unset them so they can fire again?)
        - they fire a signal

- [ ] Basic prototype
    - [ ] Implement signals
        - [x] Make commands execute only once?
            - this is necessary in cases where the command depends on multiple permanent signals. If not allowed
              to execute just once, it would fire on every frame...
        - [x] Collect all signals
            - from all animation frames for all enabled actors
            - from all commands
            - from any boundaries that are crossed
        - [x] Animation model should let you enter a signals like this
            - sprite: Hurt 1
              signals: hurt
        - [x] Should support uppercase first letter for permanent signals and lowercase first letter for one-frame signals
        - [x] Implement predicates
            - [x] Handle more than one signal as predicate
            - [x] Define the syntax for specifying a signal 
                - maybe using a colon? "signal_name:source_id", something like "remove:npc_1"
            - [x] Handle signal from specific actor type (from player)
            - [x] Handle multiple permanent signals
                - ex: user must have killed off two of the npcs for door to open
        - [x] Clear all one-frame signals from frame to frame
    - [x] Implement timer command
        - [x] Set signal after time has elapsed
        - [x] Ensure timer doesn't get set when game engine is paused 
            
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
        - [x] Triggers
            - [x] Fire trigger when actor is removed
                  - [x] add 'remove' property to animation frame to signal removal
                  - [x] add system rule where if health <= 0 and we can interrupt the state, force it to dying animation
                        where last frame of dying has 'remove' property
                  - [x] when 'remove' happens, trigger the event
            - [x] Remove boundary when last enemy in a section dies

# Bugs

[ ] Via reddit
    [x] as /u/ordinaryinstruction points out, there seems to be an entire frame devoted to turning around, which feels sluggish as you change direction. This probably isn't really a game engine thing though.
    [ ] Your texture coordinates seem to be possibly cutting off the top and right (or left, depending on which way you're facing) sides of the player sprites.
    


- [x] Set up the "view" specific code
    - [x] keyboard listeners
    - [x] renderer
    - [x] global view state
        - keyboard input state
        - gfx
        - "time"
        - paused/playing state

