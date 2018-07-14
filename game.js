// https://stackoverflow.com/questions/1584370/how-to-merge-two-arrays-in-javascript-and-de-duplicate-items
Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
};

function f_FutureSignals(future_signals, time, commands) {
    let new_future_signals = state.future_signals.filter(future_signal => future_signal.time > time)

    commands.forEach( command => {
        if (command.target == "future_signal") {
            let future_signal = { 
                id: command.signal, 
                sender_id: "script", // TODO: does this matter at all? sender_id isn't that useful here is it?
                sender_type: "script",
                time: time + command.delay }
            new_future_signals.push(future_signal)
        }
    })

    return new_future_signals
}

function f_State(state, user_input, time) {
    var new_state = {...state, time: time}
    new_state.frame_num += 1
    new_state.user_input = user_input
    new_state.world = {...state.world}

    new_state.directors = f_Directors(new_state.frame_num, state.world.map, new_state.user_input, state.world.actors, state.directors)

    let futured_signals = state.future_signals.filter(future_signal => future_signal.time <= time)
    // new_state.future_signals = state.future_signals.filter(future_signal => future_signal.time > time)

    let signals_fired = futured_signals.concat(state.signals)
    let scripts_to_execute = state.world.scripts.filter( script => {
        let allowed_to_fire = (!state.scripts_fired.includes(script.id) || (script.signal != null && script.signal.multimatch))
        return (allowed_to_fire && ScriptIsExecutable(script, signals_fired))
    })
    let new_scripts_fired = scripts_to_execute.map( script => script.id )
    new_state.scripts_fired = [...state.scripts_fired, ...new_scripts_fired].unique()

    // Generate a list of all commands from the scripts to execute. Note that there are two types of scripts:
    // 1. those that execute only once on the first signal that ever matches
    // 2. those that fire multiple times on any signal that matches the criteria (multimatch)
    // TODO: having script.signals and script.signal is clumsy
    let one_time_scripts = scripts_to_execute.filter( script => script.signals != null || !script.signal.multimatch )
    let multimatch_scripts = scripts_to_execute.filter( script => script.signals == null && script.signal.multimatch )

    let one_time_commands = one_time_scripts.map(script => {
        if (script.commands != null) {
            return script.commands
        } else {
            return [script.command]
        }
    })
    one_time_commands = [].concat(...one_time_commands) // flatten the array of arrays

    let multimatch_commands = []
    signals_fired.forEach( signal => {
        multimatch_scripts.forEach( script => {
            if (script.signal.id == signal.id && (script.signal.sender_type == null || script.signal.sender_type == signal.sender_type)) {
                let script_commands = []
                if (script.commands != null) {
                    script_commands = script.commands
                } else {
                    script_commands = [script.command]
                }
                // TODO: handle multiple commands per script
                let commands = script_commands.map( script_command => {
                    return { ...script_command, sender_id: signal.sender_id }
                })
                multimatch_commands = [].concat(commands)
            }
        })
    })
    let commands = one_time_commands.concat(multimatch_commands)
    if (commands.length > 0) {
        console.log("commands: ")
        console.log(commands)
    }

    new_state.future_signals = f_FutureSignals(state.future_signals, time, commands)
    new_state.world.billboards = f_Billboards(state.world.billboards, commands)
    new_state.world.map.boundaries = f_Boundaries(state.world.map.boundaries, commands)

    new_state.requested_directions = f_Directions(new_state.frame_num, state.world.map, new_state.user_input, state.world.actors, new_state.directors)
    new_state.system_directions = f_SystemDirections(new_state.frame_num, state.world.map, state.resources, new_state.user_input, state.world.actors, state.world.actors_touching, new_state.directors, new_state.requested_directions)

    new_state.world.actors = f_Actors(new_state.frame_num, state.world.map, new_state.system_directions, state.world.actors, commands, state.resources)

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

    let actor_signals = SignalsFromActors(new_state.world.actors, new_state.resources)

    let trigger_signals = []
    let new_triggers_fired = []
    state.world.triggers.forEach( trigger => {
        if (!state.triggers_fired.includes(trigger.id)) {
            if (trigger.trigger_type == "left_right_cross") {
                let actors = new_state.world.actors.filter( actor => actor.enabled )
                if (trigger.actor_type != null) {
                    actors = actors.filter( actor => trigger.actor_type == trigger.actor_type )
                }
                actors.forEach( actor => {
                    let old_actor = state.world.actors.find( old_actor => { return old_actor.id == actor.id } )
                    if (old_actor != null) {
                        if (old_actor.position.x < trigger.x && actor.position.x >= trigger.x) {
                            let signal = {
                                id: trigger.signal,
                                sender_id: trigger.id,
                                sender_type: 'trigger'
                            }
                            trigger_signals.push(signal)
                            new_triggers_fired.push(trigger.id)
                        }
                    }
                })
            }
        }
    })
    // Merge the new triggers with the old ones and remove dupes
    new_state.triggers_fired = [...state.triggers_fired, ...new_triggers_fired].unique()

    // Keep permanent signals from old state (i.e. those that start with capital letter)
    let permanent_signals = signals_fired.filter( signal => /[A-Z]/.test(signal.id) )

    new_state.signals = [...permanent_signals, ...actor_signals, ...trigger_signals]

    new_state.world.actors_touching = f_ActorsTouching(new_state.world.actors)

    new_state.camera = f_Camera(state, state.camera)
    new_state.hud = f_Hud(state, state.hud)

    return new_state
}

