
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

