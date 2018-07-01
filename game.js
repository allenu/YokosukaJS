
var state = {}

// Bot types:
// - bot_1: goes after nearest player actor
// - bot_2: chargest at player actor, then backs away

function CreateWorld() {
    let billboards = [
        {
            filename: "school.png",
            position: {x: 0, y: 0},
            size: {width: 2*320, height: 240}
        },
    ]
    let actors = [
        {
            id: "npc_1",
            actor_type: "npc",
            model: "alex",
            director: "bot_1",
            position: {x: 4, y: 48},
            flipped: true,
            enabled: true
        },
        {
            id: "pc",
            actor_type: "player",
            model: "alex",
            director: "user_1",
            position: {x: 4, y: 4},
            flipped: false,
            enabled: true,
        },
        // Note: this character is not immediately enabled. This is triggered once character moves past a certain line.
        {
            id: "npc_2",
            actor_type: "npc",
            model: "alex",
            director: "bot_2",
            position: {x: 320 + 32, y: 64},
            flipped: true,
            enabled: false
        },
    ]
    let boundaries = [
        // At first, disallow user from crossing x==320
        {
            id: "boundary_1",
            boundary_type: "vertical",
            x: 320,
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
        bounds: { x: 0, y: 0, width: 2*320, height: 240 },
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

function f_Directors(frame_num, world_map, user_input, actors, directors) {
    let new_directors = [...directors]

    // Update directors based on world state and type of director...
    new_directors.forEach( (director) => {
        if (director.director_type == "user_1") {
            let directions = []
            if (user_input.left) {
                directions.push("left")
            }
            if (user_input.right) {
                directions.push("right")
            }
            if (user_input.up) {
                directions.push("up")
            }
            if (user_input.down) {
                directions.push("down")
            }
            director.directions = directions
        }
    })

    return new_directors
}

function f_Actors(frame_num, world_map, directors, actors) {
    let new_actors = [...actors]

    new_actors.forEach( actor => {
        let directions = []
        directors.forEach( director => {
            if (director.id == actor.id) {
                directions = director.directions
            }
        })

        // TODO: Take action on actor based on direction.
        // TODO: We'd incorporate physics and boundary stuff here...
        if (directions[0] == "left") {
            actor.position.x -= 10
        }
        if (directions[0] == "right") {
            actor.position.x += 10
        }
        if (directions[0] == "down") {
            actor.position.y += 10
        }
        if (directions[0] == "up") {
            actor.position.y -= 10
        }
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

function LoadResources(list) {
    // TODO: Don't just assume all resources in the list are image filenames
    return new Promise( (fulfill, reject) => {
        var loadImagePromises = list.map( (image_path) => { return LoadImagePromise(image_path) } )

        Promise.all(loadImagePromises).then( (images) => {
            var image_lookup = images.reduce( (acc, image) => { 
            if (image.image != null) {
                //console.log("loading image " + image.image_path)
            }
            var acc_copy = acc
            acc_copy[image.image_path] = image.image
            return acc_copy }, {} )

            fulfill(image_lookup)
        }, () => {
            reject()
        })
    })
}

function StartGame() {
    let resource_list = [
        "images/rivercity-school.gif",
        "images/punching1.png",
        "images/punching2.png",
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
            triggers_fired: [],
            frame_rate: 5.0
        }

        Tick()
    }, () => {
        console.log("Error loading resources")
    })
}

function Tick() {
    let user_input = GetKeyState()
    state = f_State(state, user_input)

    console.log("Tick. " + state.frame_num) 

    const sprites = f_SpritesFromState(state)
	RenderSprites(canvas, sprites)

	// Set up next tick call
	const time_delta = 1000.0 / state.frame_rate
	setTimeout(Tick, time_delta)
}

function f_State(state, user_input) {
    var new_state = {...state}
    new_state.frame_num += 1
    new_state.user_input = user_input

    // TODO:
    // - execute scripts based on triggers fired
    //   - introduce new actors as necessary (enable them)
    //   - introduce new directors as necessary based on actors
    //   - disable boundaries
    // - remove actors that were eliminated last round (enabled flag)
    // - remove directors eliminated last round
    
    new_state.directors = f_Directors(new_state.frame_num, state.world.map, new_state.user_input, state.world.actors, state.directors)
    new_state.world.actors = f_Actors(new_state.frame_num, state.world.map, new_state.directors, state.world.actors)

    new_state.world.triggers = f_Triggers(state.world.triggers, state.triggers_fired)
    new_state.triggers_fired = f_TriggersFired(state.world.actors, new_state.world.actors, state.world.triggers)

    return new_state
}

function f_SpritesFromState(state) {
    let sprites = state.world.actors.filter( actor => { return actor.enabled } )
        .map( actor => {
            let image = state.resources["images/punching1.png"]
            return {
                image: image, 
                src_position: {x: 0, y: 0}, 
                src_size: {width: 48, height: 81},
                flip: actor.flipped,
                position: actor.position,
                scale: 1.0
            }
        })
    return sprites
}
