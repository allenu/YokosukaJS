
var state = {}

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
    ]

    LoadResources(resource_list).then( (resources) => {
        let world = resources["resources/world.yaml"]
        let directors = CreateInitialDirectorsFromWorld(world)
        state = {
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

        let preprocessed_sprites = PreprocessedSprites(sprites, state.resources, state.camera)
        let hud_sprites = HudSprites(state)

        preprocessed_sprites = preprocessed_sprites.concat(hud_sprites)

        RenderSprites(g_canvas, preprocessed_sprites)
    }

	// Set up next tick call
	const time_delta = 1000.0 / g_framerate
	setTimeout(Tick, time_delta)
}

