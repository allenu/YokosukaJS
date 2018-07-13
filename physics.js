
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

function f_Boundaries(boundaries, commands) {
    let new_boundaries = boundaries.map( boundary => {
        let new_boundary = {...boundary}

        commands.forEach( command => {
            if (command.target == "boundary" && command.boundary_id == boundary.id) {
                new_boundary.enabled = command.enable_boundary || false
            }
        })

        return new_boundary
    })

    return new_boundaries
}

