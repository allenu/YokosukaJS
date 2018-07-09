
# The Design of YokosukaJS

These notes are a work in progress, so might be messy at the moment. More to come!

# Three Parts

- resources (game description, artwork, models)
- state transition
- presentation (i.e. rendering sprites and playing audio)

# Functional

YokosukaJS is written in a functional style. That is, data (at least between functional blocks) is not mutated. Data flows in one direction only.

Data that comes in externally:
- resources (fixed)
- time, changes on each frame
- user inputs (changes based on keys user presses)
- previous state

On each frame, the new world state is output.

Presentation happens after the new state has been generated.

Presentation is made up of:
- rendering game backgrounds (aka "billboards")
- rendering game sprites (the actors in the game world)
- the camera position and size is used to determine what is shown
- audio sound effects

The game state needs to communicate which images to show:
- billboards are defined in the world map being displayed
- each actor has an actor model that defines the frames of animation for each state they can be in
- each frame of animation has information about the spritesheet to use, the cutout in the spritesheet, and origin (anchor point) for positioning in the world

Audio playback is communicated via "signals".

# Signals

These are generic events that can be used to communicate between subsystems in the game engine.

A signal is an event that either fires for one frame and disappears after or else fires and stays fired.

Several types of events can fire signals and several signal listeners can exist.

Events that fire signals:
- an actor dying
- a player crossing an invisible trigger line in the game world
- a specific frame of animation being shown (can signal that a specific sound should play)
- a command that sets a signal
- a timer that was previously set to fire in the future

Events that listen for signals:
- commands
- sound effects playback
- camera effects (camera shake when an actor sends a "fell on ground" signal")


# Commands

Commands are used to script events, such as

- enable or disable an actor in the world
- enable or disable a boundary
- transition from the current map to another one
- fire a signal, now or in the future after an elapsed time


# Camera Behavior

- camera tries not to go beyond the boundaries that the player can move


# Old Stuff

Elm-style definitions for the state transformations:

-- Get the next director states
f_directors : Time -> UserInput -> [Director] -> [Actor] -> World -> Time -> [Director]

-- Get next actor states. This may introduce new actors into the playfield.
f_actors : [Director] -> [Actor] -> World -> Time -> [Actor]

-- Create new directors. This looks for actors without directors and generates new ones
-- or assigns existing ones to them.
f_generate_directors : World -> Time -> [Director] -> [Actor] -> [Director]

-- Update the camera view
f_camera : Camera -> World -> [Actor] -> Camera

-- Update the world. Note that actors may cause the world's state to change.
f_world : World -> Time -> [Actor] -> World

