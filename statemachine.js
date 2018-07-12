
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

function f_Actors(frame_num, world_map, directions, actors, commands, resources) {
    let new_actors = actors.map( actor => {
        let actor_directions = []
        if (actor.enabled) {
            actor_directions = directions[actor.id]
        }
        let model = resources[actor.model]
        let new_actor = NextActorState(model, actor, actor_directions)

        commands.forEach( command => {
            if (command.command_type == "enable_actor" && command.actor_id == actor.id) {
                new_actor.enabled = true
            } else if (command.command_type == "disable_sender" && command.sender_id == actor.id) {
                new_actor.enabled = false
            }
        })
        return new_actor
    })
    return new_actors
}

