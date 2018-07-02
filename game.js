
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
        {
            filename: "images/food.png",
            position: {x: 120, y: 200},
            origin: {x: 0, y: 18},
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
            trigger_type: "npc_death",
            npc_id: "npc_1",
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
        triggers: triggers,
        scripts: scripts
    }

    return world
}

function CreateInitialDirectorsFromWorld(world) {
    let directors = world.actors.filter( actor => { return actor.enabled } )
        .map( actor => {
            return {
                director_type: actor.director,
                id: actor.id,
                directions: []
            }
        })

    return directors
}

function MovementDirectionsFromUserInput(user_input, facing_left) {
    var directions = []
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
    let new_directors = directors.map( director => { return {...director} } )

    // Update directors based on world state and type of director...
    new_directors.forEach( (director) => {
        let actor = actors.find( actor => { return actor.id == director.id } )
        let facing_left = actor.facing_left

        if (director.director_type == "user_1") {
            let directions = MovementDirectionsFromUserInput(user_input, facing_left)
            director.directions = directions
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
                director.directions = directions
            }
        }
    })

    return new_directors
}

function f_Actors(frame_num, world_map, directors, actors, resources) {
    let new_actors = actors.map( actor => {
        let directions = []
        directors.forEach( director => {
            if (director.id == actor.id) {
                directions = director.directions
            }
        })

        let model = resources[actor.model]
        let new_actor = NextActorState(model, actor, directions)
        return new_actor
    })
    return new_actors
}

function f_TriggersFired(old_actors, new_actors, triggers) {
    // For each trigger that has NOT yet fired...
    //   For each new actor, compare against old actor and see if it triggered

    return []
}

function f_Triggers(triggers, triggers_fired) {
    let new_triggers = triggers.map( trigger => {
        let fired = triggers_fired.includes(trigger.id)
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
        "images/food.png",
    ]

    LoadResources(resource_list).then( (resources) => {
        let world = CreateWorld()
        let directors = CreateInitialDirectorsFromWorld(world)
        state = {
            frame_num: 0,
            resources: resources,
            world: world,
            directors: directors,
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
    
    new_state.directors = f_Directors(new_state.frame_num, state.world.map, new_state.user_input, state.world.actors, state.directors)
    // TODO: decouple directions from each director and filter them through the system rules here
    new_state.world.actors = f_Actors(new_state.frame_num, state.world.map, new_state.directors, state.world.actors, state.resources)

    // Update position
    // TODO: Make this more functional
    new_state.world.actors.forEach( actor => {
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

    new_state.world.triggers = f_Triggers(state.world.triggers, state.triggers_fired)
    new_state.triggers_fired = f_TriggersFired(state.world.actors, new_state.world.actors, state.world.triggers)

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

