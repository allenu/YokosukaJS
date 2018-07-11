// https://stackoverflow.com/questions/1584370/how-to-merge-two-arrays-in-javascript-and-de-duplicate-items
Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
};

function f_SystemDirections(frame_num, world_map, resources, user_input, actors, actors_touching, directors, directions) {
    let system_directions = {...directions}

    // TODO: Change direction in various ways:
    // - if standing on air and not falling, do falling direction
    // - if walking into a wall, do pushing animation
    //
    // Attack an actor if some other actor of the opposite type is attacking him.
    for (var actor_id in actors_touching) {
        // See if this is being attacked by the opposite actor type. Only actors may attack the opposite type,
        // never their own.
        let opposite_actor_type = "player"
        let actor = actors.find( actor => { return actor.id == actor_id } )
        if (actor.actor_type == "player") {
            opposite_actor_type = "npc"
        }

        let actors_touching_me = actors_touching[actor_id]
	    let is_being_attacked = actors_touching_me.reduce( (acc, other_actor_id) => {
            if (acc == false) {
                let other_actor = actors.find( actor => { return actor.id == other_actor_id } )
                if (other_actor != null && other_actor.actor_type == opposite_actor_type) {
                    let model = resources[other_actor.model]
                    let animation_state = model.states[other_actor.state_name]
                    let animation_frame = animation_state.frames[other_actor.frame_index]
                    if (animation_frame.attack > 0) {
                        acc = true
                    }
                }
            }
            return acc
	    }, false)

        if (actor.health <= 0) {
		    system_directions[actor_id] = [ "die" ]
        } else if (is_being_attacked) {
		    system_directions[actor_id] = [ "hurt" ]
	    }
    }

    return system_directions
}

function f_Actors(frame_num, world_map, directions, actors, enabled_actors, disabled_actors, resources) {
    let new_actors = actors.map( actor => {
        let enable_this_actor = enabled_actors.includes(actor.id)
        let disable_this_actor = disabled_actors.includes(actor.id)

        if (!actor.enabled && !enable_this_actor) {
            return {...actor}
        }

        let actor_directions = directions[actor.id]
        if (actor_directions == null) {
            actor_directions = []
        }
        let model = resources[actor.model]
        let new_actor = NextActorState(model, actor, actor_directions)
        if (enable_this_actor) {
            new_actor.enabled = true
        } else if (disable_this_actor) {
            new_actor.enabled = false
        }
        return new_actor
    })
    return new_actors
}

function f_ActorsTouching(actors) {
    let actors_touching = {}

    // TODO: Optimize this. Right now it's O(n^2).
    actors
        .filter( actor => actor.enabled )
        .forEach( actor => {
        let touching_actor = []

        actors
            .filter( actor => actor.enabled )
            .forEach( other_actor => {
            if (other_actor.id != actor.id) {
                var x_squared = Math.pow((actor.position.x - other_actor.position.x), 2)
                var y_squared = Math.pow((actor.position.y - other_actor.position.y), 2)
                var distance = Math.sqrt(x_squared + y_squared)
                if (distance <= 32.0) {
                    touching_actor.push(other_actor.id)
                }
            }
        })
        actors_touching[actor.id] = touching_actor
    })
    
    return actors_touching
}

function f_State(state, user_input, time) {
    var new_state = {...state, time: time}
    new_state.frame_num += 1
    new_state.user_input = user_input
    new_state.world = {...state.world}

    new_state.directors = f_Directors(new_state.frame_num, state.world.map, new_state.user_input, state.world.actors, state.directors)

    let futured_signals = state.future_signals.filter(future_signal => future_signal.time <= time)
    new_state.future_signals = state.future_signals.filter(future_signal => future_signal.time > time)

    let signals_from_last_state = futured_signals.concat(state.signals)

    // See which actors are enabled by any scripts
    let enabled_actors = []
    let disabled_actors = []
    let enable_boundaries = []
    let disable_boundaries = []
    let new_scripts_fired = []
    let show_billboards = []
    let hide_billboards = []
    state.world.scripts.forEach( script => {
        if (state.scripts_fired.includes(script.id)) {
            return
        }

        // See if this script's signal predicate matches
        let required_signals = []
        if (script.signals) {
            // More than one signal must match
            required_signals = script.signals
        } else {
            required_signals = [script.signal]
        }

        let matching_signals = required_signals.reduce( (accumulator, required_signal) => {
            // See if the required signal is one that was fired in the previous state.
            let filtered_signals = signals_from_last_state.filter( signal => {
                let matches_sender_id = (required_signal.sender_id == null || required_signal.sender_id == signal.sender_id)
                let matches_sender_type = (required_signal.sender_type == null || required_signal.sender_type == signal.sender_type)
                return matches_sender_id && matches_sender_type
            })

            let source_signal = filtered_signals.find( signal => signal.id == required_signal.id )
            if (source_signal != null) {
                return accumulator.concat(source_signal)
            }
            return accumulator
        }, [])

        // If all matching signals were fired, then go ahead and execute the command.
        if (matching_signals.length == required_signals.length) {
            if (script.command.command_type == "disable_sender") {
                let source_signal = matching_signals[0]
                if (source_signal.sender_type == 'actor') {
                    let actor = state.world.actors.find( actor => actor.enabled && actor.id == source_signal.sender_id )
                    if (actor != null) {
                        disabled_actors.push(actor.id)
                        if (!script.repeatable) {
                            new_scripts_fired.push(script.id)
                        }
                    }
                }
            } else if (script.command.command_type == "boundary") {
                // Toggle boundary setting
                if (script.command.enable_boundary) {
                    enable_boundaries.push(script.command.boundary_id)
                } else {
                    disable_boundaries.push(script.command.boundary_id)
                }
                if (!script.repeatable) {
                    new_scripts_fired.push(script.id)
                }
            } else if (script.command.command_type == "enable_actor") {
                enabled_actors.push(script.command.actor_id)
                if (!script.repeatable) {
                    new_scripts_fired.push(script.id)
                }
            } else if (script.command.command_type == "toggle_billboard") {
                let hidden = script.command.hidden || false
                if (hidden) {
                    hide_billboards.push(script.command.billboard_id)
                } else {
                    show_billboards.push(script.command.billboard_id)
                }

                if (!script.repeatable) {
                    new_scripts_fired.push(script.id)
                }
            } else if (script.command.command_type == "future_signal") {
                let future_signal = { 
                    id: script.command.signal, 
                    sender_id: script.id,
                    sender_type: "script",
                    time: new_state.time + script.command.delay }
                new_state.future_signals.push(future_signal)
                if (!script.repeatable) {
                    new_scripts_fired.push(script.id)
                }
            }
        }
    })

    // Toggle billboards
    new_state.world.billboards = state.world.billboards.map( billboard => {
        let new_billboard = {...billboard}
        if (show_billboards.includes(billboard.id)) {
            new_billboard.hidden = false
        } else if (hide_billboards.includes(billboard.id)) {
            new_billboard.hidden = true
        }
        return new_billboard
    })

    // Toggle boundaries
    new_state.world.map.boundaries = state.world.map.boundaries.map( boundary => {
        let new_boundary = {...boundary}
        if (enable_boundaries.includes(boundary.id)) {
            new_boundary.enabled = true
        } else if (disable_boundaries.includes(boundary.id)) {
            new_boundary.enabled = false
        }
        return new_boundary
    })

    new_state.requested_directions = f_Directions(new_state.frame_num, state.world.map, new_state.user_input, state.world.actors, new_state.directors)
    new_state.system_directions = f_SystemDirections(new_state.frame_num, state.world.map, state.resources, new_state.user_input, state.world.actors, state.world.actors_touching, new_state.directors, new_state.requested_directions)

    new_state.world.actors = f_Actors(new_state.frame_num, state.world.map, new_state.system_directions, state.world.actors, enabled_actors, disabled_actors, state.resources)

    // Update position
    // TODO: Make this more functional
    // TODO: Consider just moving actor positions to their own dictionary, separate from the actors list
    new_state.world.actors
        .filter( actor => actor.enabled )
        .forEach( actor => {
        let model = state.resources[actor.model]
        let animation_state = model.states[actor.state_name]
        let animation_frame = animation_state.frames[actor.frame_index]
        let x_move = 0
        let y_move = 0
        if (animation_frame.x_move) {
            var factor = actor.facing_left ? (-1.0) : 1.0

            if (actor.actor_type == "npc") {
                factor = factor * 0.5 // Enemy is slower!
            }

            x_move = animation_frame.x_move * factor
        }
        if (animation_frame.y_move) {
            y_move = animation_frame.y_move
        }
        if (animation_frame.flip) {
            actor.facing_left = actor.facing_left ? false : true
        }
        let new_position = {...actor.position}
        new_position.x += x_move
        new_position.y += y_move

        // Physical constraint rules
        new_position.x = Math.max(new_position.x, state.world.map.bounds.x)
        new_position.x = Math.min(new_position.x, state.world.map.bounds.x + state.world.map.bounds.width)
        new_position.y = Math.max(new_position.y, state.world.map.bounds.y)
        new_position.y = Math.min(new_position.y, state.world.map.bounds.y + state.world.map.bounds.height)

        // Disallow crossing boundaries
        state.world.map.boundaries
            .filter(boundary => boundary.enabled)
            .forEach( boundary => {
                // TODO: allow only certain types of actors to be affected by boundaries
                if (boundary.boundary_type == "less_than_x") {
                    new_position.x = Math.min(new_position.x, boundary.x)
                }
            })

        actor.position = new_position
    })

    // Update health based on previous state health_hit property
    new_state.world.actors
        .filter( actor => actor.enabled )
        .forEach( actor => {
        let model = state.resources[actor.model]
        let animation_state = model.states[actor.state_name]
        let animation_frame = animation_state.frames[actor.frame_index]

        if (animation_frame.health_hit > 0) {
            actor.health -= animation_frame.health_hit
        }
    })

    let actor_signals = SignalsFromActors(new_state.world.actors, new_state.resources)

    let trigger_signals = []
    let new_triggers_fired = []
    state.world.triggers.forEach( trigger => {
        if (!state.triggers_fired.includes(trigger.id)) {
            if (trigger.trigger_type == "left_right_cross") {
                let actors = new_state.world.actors.filter( actor => actor.enabled )
                if (trigger.actor_type != null) {
                    actors = actors.filter( actor => trigger.actor_type == trigger.actor_type )
                }
                actors.forEach( actor => {
                    let old_actor = state.world.actors.find( old_actor => { return old_actor.id == actor.id } )
                    if (old_actor != null) {
                        if (old_actor.position.x < trigger.x && actor.position.x >= trigger.x) {
                            let signal = {
                                id: trigger.signal,
                                sender_id: trigger.id,
                                sender_type: 'trigger'
                            }
                            trigger_signals.push(signal)
                            new_triggers_fired.push(trigger.id)
                        }
                    }
                })
            }
        }
    })
    // Merge the new triggers with the old ones and remove dupes
    new_state.triggers_fired = [...state.triggers_fired, ...new_triggers_fired].unique()
    new_state.scripts_fired = [...state.scripts_fired, ...new_scripts_fired].unique()

    // Keep permanent signals from old state (i.e. those that start with capital letter)
    let permanent_signals = signals_from_last_state.filter( signal => /[A-Z]/.test(signal.id) )

    new_state.signals = [...permanent_signals, ...actor_signals, ...trigger_signals]

    new_state.world.actors_touching = f_ActorsTouching(new_state.world.actors)

    new_state.camera = f_Camera(state, state.camera)
    new_state.hud = f_Hud(state, state.hud)

    return new_state
}

