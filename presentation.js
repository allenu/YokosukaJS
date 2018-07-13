
function f_Camera(state, camera) {
    let new_camera = {...camera}

    let target = camera.target

    // Try to center in on the player actor
    let player_actor = state.world.actors.find( actor => { return actor.actor_type == "player" } )
    if (player_actor) {
        target = {x: player_actor.position.x - camera.size.width / 2,
                  y: player_actor.position.y - camera.size.height / 2}
    }


    let min_x = state.world.map.bounds.x
    let max_x = state.world.map.bounds.x + state.world.map.bounds.width

    // Limit right side based on any boundaries enabled
    state.world.map.boundaries
        .filter( boundary => boundary.enabled )
        .forEach( boundary => {
            if (boundary.boundary_type == "less_than_x") {
                max_x = Math.min(boundary.x, max_x)
            }
        })

    let min_max_x_delta = max_x - min_x
    if (min_max_x_delta < state.camera.size.width) {
        target.x = min_x
    } else if (target.x < min_x) {
        // Disallow scrolling left beyond min_x
        target.x = min_x
    } else if (target.x >= max_x - state.camera.size.width) {
        // Disallow scrollling right beyond max_x
        target.x = max_x - state.camera.size.width
    }

    // Move towards the target
    let inc_x = 0
    let max_x_delta = 10
    if (camera.position.x < target.x) {
        inc_x = Math.min(max_x_delta, target.x - camera.position.x)
    } else if (camera.position.x > target.x) {
        inc_x = Math.max(-max_x_delta, target.x - camera.position.x)
    }
    let inc_y = 0
    let max_y_delta = 0 // Set to 0 because we don't want to allow vertical camera movement
    if (camera.position.y < target.y) {
        inc_y = Math.min(max_y_delta, target.y - camera.position.y)
    } else if (camera.position.y > target.y) {
        inc_y = Math.max(-max_y_delta, target.x - camera.position.y)
    }

    let new_position = {x: camera.position.x + inc_x, y: camera.position.y + inc_y}
    new_camera.target = target
    new_camera.position = new_position

    return new_camera
}

function f_Hud(state, hud) {
    hud = hud || {left: {}, right: {}}
    let new_hud = {...hud}

    // Set up the left bar
    let player = state.world.actors.find( actor => actor.actor_type == "player" )
    new_hud.left.actor = player

    // Set up the left bar
    let enemy = state.world.actors.find( actor => actor.enabled && actor.actor_type == "npc" )
    new_hud.right.actor = enemy

    let max_health_change = 0.1
    let entries = [ new_hud.left, new_hud.right ]
    entries.forEach( entry => {
        if (!entry.actor) {
            return
        }

        entry.target = entry.actor.health / entry.actor.full_health 

        // Doesn't have a percent yet, so immediately set it to the target
        if (!entry.percent) {
            entry.percent = entry.target
        } else {
            if (entry.percent != entry.target) {
                let delta = entry.target - entry.percent
                if (entry.percent < entry.target) {
                    entry.percent += Math.min(max_health_change, delta)
                } else {
                    entry.percent += Math.max(-max_health_change, delta)
                }
            }
        }
    })


    return new_hud
}

function PreprocessedSprites(sprites, resources, camera) {
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

	    let scale = {x: 1.0, y: 1.0}
        if (sprite.scale) {
            scale = sprite.scale
        }
	    let position = {x: sprite.position.x - cutout_origin.x*scale.x - camera.position.x, 
		        	    y: sprite.position.y - cutout_origin.y*scale.y - camera.position.y}

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

function HudSprites(state) {
    let hud_sprites = []

    let ui_billboard_sprites = state.world.billboards.filter( billboard => !billboard.hidden && billboard.billboard_type == 'ui' )
        .map( billboard => {
            let position = {x: billboard.position.x - billboard.origin.x*billboard.scale.x,
                            y: billboard.position.y - billboard.origin.y*billboard.scale.y,}
            return {
                image: state.resources[billboard.filename],
                position: position,
                scale: billboard.scale
            }
        })

    let x_offset = 16
    let entries = [state.hud.left, state.hud.right]
    entries.forEach( entry => {
        if (!entry.actor) { return }

        let health_width = 120
        let height = 16.0 / 32.0

        let border = {
            image: state.resources["images/black_rect.png"],
            position: {x: x_offset-4.0, y: 16 - 4},
            origin: {x: 0, y: 0},
            scale: {x: (health_width+8.0)/32.0, y: 24.0/32.0}
        }
        hud_sprites.push(border)

        if (entry.percent < 1.0) {
            let x = x_offset + entry.percent * health_width
            let width = (1-entry.percent) * health_width / 32.0

            let left_energy_bar_red = {
                image: state.resources["images/red_rect.png"],
                position: {x: x, y: 16},
                origin: {x: 0, y: 0},
                scale: {x: width, y: height}
            }
            hud_sprites.push(left_energy_bar_red)
        }
        if (entry.percent > 0.0) {
            let x = x_offset
            let width = entry.percent * health_width / 32.0

            let left_energy_bar_yellow = {
                image: state.resources["images/yellow_rect.png"],
                position: {x: x, y: 16},
                origin: {x: 0, y: 0},
                scale: {x: width, y: height}
            }
            hud_sprites.push(left_energy_bar_yellow)
        }

        x_offset += 160
    })

    return ui_billboard_sprites.concat(hud_sprites)
}

function f_SpritesFromState(state) {
    let actor_sprites = state.world.actors.filter( actor => { return actor.enabled } )
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
            let scale = actor.scale || {x: 1.0, y: 1.0}

	        return {
                image: actor.sprites,
                spritesheet: actor.spritesheet, 
                sprite_name: sprite_name,
                scale: scale,
                flip: flip,
                position: position
            }
        })
    let world_billboard_sprites = state.world.billboards.filter( billboard => !billboard.hidden && billboard.billboard_type != 'ui' )
        .map( billboard => {
        return {
            image: billboard.filename,
            position: billboard.position,
            origin: billboard.origin,
            scale: billboard.scale
        }
    })

    return actor_sprites.concat(world_billboard_sprites)
}

function f_Billboards(billboards, commands) {
    let new_billboards = billboards.map( billboard => {
        let new_billboard = {...billboard}

        commands.forEach( command => {
            if (command.target == "billboard" && command.billboard_id == billboard.id) {
                new_billboard.hidden = command.hidden || false
            }
        })

        return new_billboard
    })

    return new_billboards
}

