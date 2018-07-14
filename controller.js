
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
            signals: ["initialized"], // A signal on the first frame
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

        // Play audio
        let signal_ids = state.signals.map(signal => signal.id)
        if (signal_ids.includes("sfx_oof")) {
            console.log("oof")
            PlayNote()
        }
    }

	// Set up next tick call
	const time_delta = 1000.0 / g_framerate
	setTimeout(Tick, time_delta)
}

function PlayNote() {
    let envelope = {
        attack_time: 0.05,
        attack_gain: 1.0,
        decay_time: 0.1,
        sustain_gain: 0.8,
        release_time: 0.20,
    }

    let noise = {
        oscillator: kNoiseWave,
        envelope: envelope,
    }
    let square = {
        oscillator: kSquareWave,
        envelope: envelope,
    }

    let synth_commands = [
        {
            action_type: kSynthesizerAction_PlayTone,
            channel: 0,
            instrument: noise,
            freq: 220,
            time: g_audio_time + 0.05
        },
        {
            action_type: kSynthesizerAction_ReleaseTone,
            channel: 0,
            time: g_audio_time + 0.15
        },
        {
            action_type: kSynthesizerAction_PlayTone,
            channel: 1,
            instrument: square,
            freq: 180,
            time: g_audio_time
        },
        {
            action_type: kSynthesizerAction_ReleaseTone,
            channel: 1,
            time: g_audio_time + 0.1
        },
        {
            action_type: kSynthesizerAction_PlayTone,
            channel: 2,
            instrument: square,
            freq: 60,
            time: g_audio_time + 0.1
        },
        {
            action_type: kSynthesizerAction_ReleaseTone,
            channel: 2,
            time: g_audio_time + 0.4
        },
        {
            action_type: kSynthesizerAction_PlayTone,
            channel: 3,
            instrument: square,
            freq: 120,
            time: g_audio_time + 0.2
        },
        {
            action_type: kSynthesizerAction_ReleaseTone,
            channel: 3,
            time: g_audio_time + 0.3
        },
    ]
    if (g_synthesizer != null) {
        g_synthesizer = f_next_synthesizer_state(g_synthesizer, synth_commands)
    }
}

