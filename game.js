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

function f_State(state, user_input, time) {
    var new_state = {...state, time: time}
    new_state.frame_num += 1
    new_state.user_input = user_input
    new_state.world = {...state.world}

    new_state.directors = f_Directors(new_state.frame_num, state.world.map, new_state.user_input, state.world.actors, state.directors)

    let futured_signals = state.future_signals.filter(future_signal => future_signal.time <= time)
    new_state.future_signals = state.future_signals.filter(future_signal => future_signal.time > time)

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

    // TODO: handle multiple commands and concat them all
    let one_time_commands = one_time_scripts.map(script => script.command)
    let multimatch_commands = []
    signals_fired.forEach( signal => {
        multimatch_scripts.forEach( script => {
            if (script.signal.id == signal.id && (script.signal.sender_type == null || script.signal.sender_type == signal.sender_type)) {
                // TODO: handle multiple commands per script
                let command = { ...script.command, sender_id: signal.sender_id }
                multimatch_commands.push(command)
            }
        })
    })
    let commands = one_time_commands.concat(multimatch_commands)
    if (commands.length > 0) {
        console.log("commands: ")
        console.log(commands)
    }

    // See which actors are enabled by any scripts
    // TODO: Turn these into a command pattern: ex: to enable an actor
    // { object_type: "actor",
    //   properties: [ { "enable" : true } ],
    //   object_id: "player"
    // }
    let show_billboards = []
    let hide_billboards = []
    state.world.scripts.forEach( script => {
        if (state.scripts_fired.includes(script.id)) {
            return
        }

        // See if this script's signal predicate matches
        let required_signals = []
        if (script.signals) {
            // More than one signal must match
            required_signals = script.signals
        } else {
            required_signals = [script.signal]
        }

        let matching_signals = required_signals.reduce( (accumulator, required_signal) => {
            // See if the required signal is one that was fired in the previous state.
            let filtered_signals = signals_fired.filter( signal => {
                let matches_sender_id = (required_signal.sender_id == null || required_signal.sender_id == signal.sender_id)
                let matches_sender_type = (required_signal.sender_type == null || required_signal.sender_type == signal.sender_type)
                return matches_sender_id && matches_sender_type
            })

            let source_signal = filtered_signals.find( signal => signal.id == required_signal.id )
            if (source_signal != null) {
                return accumulator.concat(source_signal)
            }
            return accumulator
        }, [])

        // If all matching signals were fired, then go ahead and execute the command.
        if (matching_signals.length == required_signals.length) {
            if (script.command.command_type == "toggle_billboard") {
                let hidden = script.command.hidden || false
                if (hidden) {
                    hide_billboards.push(script.command.billboard_id)
                } else {
                    show_billboards.push(script.command.billboard_id)
                }
            } else if (script.command.command_type == "future_signal") {
                let future_signal = { 
                    id: script.command.signal, 
                    sender_id: script.id,
                    sender_type: "script",
                    time: new_state.time + script.command.delay }
                new_state.future_signals.push(future_signal)
            }
        }
    })

    // Toggle billboards
    new_state.world.billboards = state.world.billboards.map( billboard => {
        let new_billboard = {...billboard}
        if (show_billboards.includes(billboard.id)) {
            new_billboard.hidden = false
        } else if (hide_billboards.includes(billboard.id)) {
            new_billboard.hidden = true
        }
        return new_billboard
    })

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

