
var state = {}
var g_time = 0.0

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

function StartGame() {
    let resource_list = [
        "resources/world.yaml",
        "resources/model.yaml",
        "resources/spritesheet.json",
        "images/rivercity-school.gif",
        "images/alex.png",
        "images/ryan.png",
        "images/yellow_rect.png",
        "images/red_rect.png",
        "images/black_rect.png",
        "images/game-over.png",
    ]

    LoadResources(resource_list).then( (resources) => {
        let world = resources["resources/world.yaml"]
        let directors = CreateInitialDirectorsFromWorld(world)
        state = {
            time: 0.0,
            frame_num: 0,
            resources: resources,
            world: world,
            directors: directors,
            requested_directions: [],
            system_directions: [],
            signals: [],
            user_input: {},
            triggers_fired: [],
            scripts_fired: [],
            future_signals: [],
            camera: { position: {x: 0, y: 0}, target: {x: 0, y: 0}, size: { width: 320, height: 240 } }
        }

        Tick()
    }, () => {
        console.log("Error loading resources")
    })
}

function Tick() {
    if (!g_paused) {
        let user_input = {...GetKeyState()}
        let frame_time = 1.0 / g_framerate
        g_time = g_time + frame_time

        state = f_State(state, user_input, g_time)

        //console.log("Tick. " + state.frame_num) 
        //console.log(state)

        let sprites = f_SpritesFromState(state)

        let preprocessed_sprites = PreprocessedSprites(sprites, state.resources, state.camera)
        let hud_sprites = HudSprites(state)

        preprocessed_sprites = preprocessed_sprites.concat(hud_sprites)

        RenderSprites(g_canvas, preprocessed_sprites)
    }

	// Set up next tick call
	const time_delta = 1000.0 / g_framerate
	setTimeout(Tick, time_delta)
}

