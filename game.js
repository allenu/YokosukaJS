
var state = {}

// Bot types:
// - bot_1: goes after nearest player actor
// - bot_2: chargest at player actor, then backs away

function CreateWorld() {
    let billboards = [
        {
            filename: "images/rivercity-school.gif",
            position: {x: 0, y: 0},
            origin: {x: 0, y: 0},
            scale: 1.5
        },
    ]
    let actors = [
        {
            id: "npc_1",
            actor_type: "npc",
            model: "resources/model.yaml",
            sprites: "images/ryan.png",
            spritesheet: "resources/spritesheet.json",
            state_name: "standing",
            frame_index: 0,
            director: "bot_1",
            position: {x: 128, y: 96},
            health: 2,
            facing_left: true,
            enabled: true
        },
        {
            id: "pc",
            actor_type: "player",
            model: "resources/model.yaml",
            sprites: "images/alex.png",
            spritesheet: "resources/spritesheet.json",
            state_name: "standing",
            frame_index: 0,
            director: "user_1",
            position: {x: 64, y: 128},
            health: 5,
            facing_left: false,
            enabled: true,
        },
        // Note: this character is not immediately enabled. This is triggered once character moves past a certain line.
        {
            id: "npc_2",
            actor_type: "npc",
            model: "resources/model.yaml",
            sprites: "images/ryan.png",
            spritesheet: "resources/spritesheet.json",
            state_name: "standing",
            frame_index: 0,
            director: "bot_2",
            position: {x: 320 + 32, y: 64},
            health: 5,
            facing_left: true,
            enabled: false
        },
    ]
    let boundaries = [
        // At first, disallow user from crossing x==320
        {
            id: "boundary_1",
            boundary_type: "less_than_x",
            x: 300,
            enabled: true
        }
    ]
    let triggers = [
        // When npc_1 defeated, cause boundary to disappear
        {
            id: "npc_1_died",
            trigger_type: "npc_remove",
            actor_id: "npc_1",
            fired: false
        },
        // When player crosses x=320, then enable actor npc_2
        {
            id: "crossed_line",
            trigger_type: "left_right_cross",
            x: 320,
            fired: false
        },
    ]
    // For now, scripts are executed when a trigger fires. In the future we
    // could probably allow scripts to execute other scripts or something
    // more sophisticated.
    let scripts = [
        {
            id: "turn_off_boundary",
            trigger: "npc_1_died",
            command: {
                command_type: "boundary",
                boundary_id: "boundary_1",
                enable: false
            },
        },
        {
            id: "enable_npc_2",
            trigger: "crossed_line",
            command: {
                command_type: "enable_actor",
                actor_id: "npc_2"
            },
        }
    ]
    let map = {
        bounds: { x: 32, y: 160, width: 2*320, height: 64 },
        boundaries: boundaries
    }

    let world = {
        map: map,
        billboards: billboards,
        actors: actors,
        actors_touching: {},
        triggers: triggers,
        scripts: scripts
    }

    return world
}

function CreateInitialDirectorsFromWorld(world) {
    // Note: directors are created even for disabled actors
    // TODO: optimize which directors are in memory. we probably don't need them for disabled actors.
    let directors = world.actors.map( actor => {
            return {
                director_type: actor.director,
                id: actor.id
            }
        })

    return directors
}

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

function f_Actors(frame_num, world_map, directions, actors, enabled_actors, resources) {
    let new_actors = actors.map( actor => {
        let enable_this_actor = enabled_actors.includes(actor.id)

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

function f_TriggersFired(old_actors, new_actors, triggers) {
    // For each trigger that has NOT yet fired...
    //   For each new actor, compare against old actor and see if it triggered

    return []
}

function f_Triggers(triggers, triggers_fired) {
    let new_triggers = triggers.map( trigger => {
        let fired = triggers_fired.includes(trigger.id) || trigger.fired
        return {...trigger, fired: fired}
    })

    return new_triggers
}

function StartGame() {
    let resource_list = [
        "resources/model.yaml",
        "resources/spritesheet.json",
        "images/rivercity-school.gif",
        "images/alex.png",
        "images/ryan.png",
    ]

    LoadResources(resource_list).then( (resources) => {
        let world = CreateWorld()
        let directors = CreateInitialDirectorsFromWorld(world)
        state = {
            frame_num: 0,
            resources: resources,
            world: world,
            directors: directors,
            requested_directions: [],
            system_directions: [],
            user_input: {},
            triggers_fired: []
        }

        Tick()
    }, () => {
        console.log("Error loading resources")
    })
}

function Tick() {
    if (!g_paused) {
        let user_input = {...GetKeyState()}
        state = f_State(state, user_input)

        console.log("Tick. " + state.frame_num) 
        console.log(state)

        let sprites = f_SpritesFromState(state)
        let billboard_sprites = state.world.billboards.map( billboard => {
            return {
                image: billboard.filename,
                position: billboard.position,
                origin: billboard.origin,
                scale: billboard.scale
            }
        })
        sprites = sprites.concat(billboard_sprites)

        let preprocessed_sprites = PreprocessedSprites(sprites, state.resources)

        RenderSprites(g_canvas, preprocessed_sprites)
    }

	// Set up next tick call
	const time_delta = 1000.0 / g_framerate
	setTimeout(Tick, time_delta)
}

function f_State(state, user_input) {
    var new_state = {...state}
    new_state.frame_num += 1
    new_state.user_input = user_input
    new_state.world = {...state.world}

    // TODO:
    // - execute scripts based on triggers fired
    //   - introduce new actors as necessary (enable them)
    //   - introduce new directors as necessary based on actors
    //   - disable boundaries
    // - remove actors that were eliminated last round (enabled flag)
    // - remove directors eliminated last round
    //

    new_state.directors = f_Directors(new_state.frame_num, state.world.map, new_state.user_input, state.world.actors, state.directors)

    // See which actors are enabled by any scripts
    let enabled_actors = []
    let enable_boundaries = []
    let disable_boundaries = []
    state.world.scripts.forEach( script => {
        if (state.triggers_fired.includes(script.trigger)) {
            if (script.command.command_type == "enable_actor") {
                enabled_actors.push(script.command.actor_id)
            } else if (script.command.command_type == "boundary") {
                // Toggle boundary setting
                if (script.command.enable) {
                    enable_boundaries.push(script.command.boundary_id)
                } else {
                    disable_boundaries.push(script.command.boundary_id)
                }
            }
        }
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

    new_state.world.actors = f_Actors(new_state.frame_num, state.world.map, new_state.system_directions, state.world.actors, enabled_actors, state.resources)

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

    let triggers_fired = []
    state.world.triggers.forEach( trigger => {
        if (!trigger.fired) {
            if (trigger.trigger_type == "npc_remove") {
                let actor = new_state.world.actors
                    .find( actor => {
                        if (actor.enabled && actor.id == trigger.actor_id) {
                            let model = state.resources[actor.model]
                            let animation_state = model.states[actor.state_name]
                            let animation_frame = animation_state.frames[actor.frame_index]
                            return animation_frame.remove
                        } else {
                            return false
                        }
                    })

                if (actor != null) {
                    triggers_fired.push(trigger.id)
                }
            } else if (trigger.trigger_type == "left_right_cross") {
                // See which player actors crossed the line
                new_state.world.actors.forEach( actor => {
                    let old_actor = state.world.actors.find( old_actor => { return old_actor.id == actor.id } )
                    if (old_actor != null) {
                        if (old_actor.position.x < trigger.x && actor.position.x >= trigger.x) {
                            triggers_fired.push(trigger.id)
                        }
                    }
                })
            }
        }
    })
    new_state.triggers_fired = triggers_fired

    // new_state.triggers_fired = f_TriggersFired(state.world.actors, new_state.world.actors, state.world.triggers)
    
    new_state.world.triggers = f_Triggers(state.world.triggers, new_state.triggers_fired)

    // TODO: Remove any actors that have "remove" set to true
    new_state.world.actors
        .filter( actor => actor.enabled )
        .forEach( actor => {
        let model = state.resources[actor.model]
        let animation_state = model.states[actor.state_name]
        let animation_frame = animation_state.frames[actor.frame_index]
        if (animation_frame.remove) {
            actor.enabled = false
        }
    })

    new_state.world.actors_touching = f_ActorsTouching(new_state.world.actors)


    return new_state
}

function f_SpritesFromState(state) {
    let sprites = state.world.actors.filter( actor => { return actor.enabled } )
        .map( actor => {
            let model = state.resources[actor.model]

            let animation_state = model.states[actor.state_name]
            if (!animation_state) {
                console.log("animation state not found: " + actor.state_name)
            }
            var animation_frame = animation_state.frames[actor.frame_index]
            if (!animation_frame) {
                console.log("animation frame not found: " + actor.frame_index)
            }

            let sprite_name = animation_frame.sprite
            let flip = actor.facing_left
            let position = actor.position

	        return {
                image: actor.sprites,
                spritesheet: actor.spritesheet, 
                sprite_name: sprite_name,
                flip: flip,
                position: position
            }
        })
    return sprites
}

function PreprocessedSprites(sprites, resources) {
    // Sprites we get from f_SpritesFromState is just info about which sprite
    // to draw and where in the world map we want it. We need to cull this set
    // of sprites and sort them in proper draw order. On top of that, we need
    // to extract the sprite data from the spritesheets.


	// sort so that entries with lower 'y' get drawn first
	let output_sprites = sprites.sort( (a,b) => {
	    if (a.position.y < b.position.y) {
            return -1
	    } else if (a.position.y == b.position.y) {
            if (a.position.x < b.position.x) {
                return -1
            } 
	    }
	    return 1
	}).map( (sprite) => {
	    let image = resources[sprite.image]
        let cutout = {}

        if (sprite.spritesheet != null) {
            let spritesheet = resources[sprite.spritesheet]
            // TODO: Make the spritesheet a dictionary so we don't need to generate this lookup
            let cutout_lookup = {}
            spritesheet.images.forEach( (s) => {
                cutout_lookup[s.name] = s
            } )
            cutout = cutout_lookup[sprite.sprite_name]
        } else {
            cutout = { 
                bounds: [0, 0, image.naturalWidth, image.naturalHeight],
                origin: sprite.origin
            }
        }

	    let cutout_origin = {...cutout.origin}
	    if (sprite.flip) {
		    cutout_origin.x = cutout.bounds[2] - cutout_origin.x
	    }

	    let scale = 1.0
        if (sprite.scale) {
            scale = sprite.scale
        }
	    let position = {x: sprite.position.x - cutout_origin.x*scale, 
		        	    y: sprite.position.y - cutout_origin.y*scale}

	    let output_sprite = { 
            image: resources[sprite.image], 
			src_position: {x: cutout.bounds[0], y: cutout.bounds[1]}, 
			src_size: {width: cutout.bounds[2], height: cutout.bounds[3]},
			flip: sprite.flip,
			position: position, 
            scale: scale
        }
	    return output_sprite
	})

    return output_sprites
}

