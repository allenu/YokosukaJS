
function MovementDirectionsFromUserInput(user_input, facing_left) {
    let directions = []
    if (user_input.a_key) {
        directions.push("punch")
    }
    if (user_input.s_key) {
        directions.push("kick")
    }
    if (user_input.left) {
        if (facing_left == true) {
            if (user_input.down) {
                directions.push("forward_down")
            } else if (user_input.up) {
                directions.push("forward_up")
            } else {
                directions.push("forward")
            }
        } else {
            directions.push("backward")
        }
    } else if (user_input.right) {
        if (facing_left == true) {
            directions.push("backward")
        } else {
            if (user_input.down) {
                directions.push("forward_down")
            } else if (user_input.up) {
                directions.push("forward_up")
            } else {
                directions.push("forward")
            }
        }
    } else if (user_input.down) {
        // Just hitting down
        directions.push("down")
    } else if (user_input.up) {
        // Just hitting up
        directions.push("up")
    }

    return directions
}

function f_Directors(frame_num, world_map, user_input, actors, directors) {
    let new_directors = directors.map( director => { 
        // TODO: Update each director's state. For now, they're really just stateless.
        return {...director} 
    })
    return new_directors
}

function f_Directions(frame_num, world_map, user_input, actors, directors) {
    let all_directions = {}

    // Update directors based on world state and type of director...
    directors.forEach( (director) => {
        let actor = actors.find( actor => { return actor.id == director.id } )
        let facing_left = actor.facing_left

        if (director.director_type == "user_1") {
            let directions = MovementDirectionsFromUserInput(user_input, facing_left)
            all_directions[director.id] = directions
        } else {
            // TODO: Make this more sophisticated. For now, assume NPC.
            // TODO: Find nearest PC
            // TODO: Handle coordinating directors as well. Use the director state...
            let target_actor = actors.find( actor => { return actor.actor_type == "player" && actor.enabled } )
            if (target_actor != null) {
                let target = {y: target_actor.position.y}

                // if target x < 160, then target is to his right
                if (target_actor.position.x < 160) {
                    target.x = target_actor.position.x + 24
                }
                // else target is to his left
                else {
                    target.x = target_actor.position.x - 24
                }

                // Attempt to walk to the target
                let is_below = target.y > actor.position.y
                let is_at_same_level = target.y == actor.position.y
                let user_input = {}

                let abs_x_distance = Math.abs(actor.position.x - target.x)
                if (actor.position.x < target.x && abs_x_distance > 8) {
                    user_input.right = true
                } else if (actor.position.x > target.x && abs_x_distance > 8) {
                    user_input.left = true
                } else if ( actor.position.x < target_actor.position.x && actor.facing_left ) {
                    user_input.right = true
                } else if ( actor.position.x > target_actor.position.x && actor.facing_right ) {
                    user_input.left = true
                }

                let abs_y_distance = Math.abs(actor.position.y - target.y)
                if (actor.position.y < target.y && abs_y_distance > 8) {
                    user_input.down = true
                } else if (actor.position.y > target.y && abs_y_distance > 8) {
                    user_input.up = true
                }
                let directions = MovementDirectionsFromUserInput(user_input, actor.facing_left)

                // If close to target, then randomly attack
                let x_squared = Math.pow((target_actor.position.x - actor.position.x),2)
                let y_squared = Math.pow((target_actor.position.y - actor.position.y),2)
                let distance = Math.sqrt(x_squared + y_squared)
                if (distance <= 32.0) {
                    // CPU player
                    if (Math.random() < 0.05) {
                        directions.push("punch")
                    } else if (Math.random() < 0.05) {
                        directions.push("kick")
                    }
                }
                all_directions[director.id] = directions
            }
        }
    })

    return all_directions
}
