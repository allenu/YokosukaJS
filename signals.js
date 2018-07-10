
function SignalsFromActors(actors, resources) {
    let actor_signals = actors.filter( actor => actor.enabled )
        .map( actor => {
            let model = resources[actor.model]
            let animation_state = model.states[actor.state_name]
            let animation_frame = animation_state.frames[actor.frame_index]
            if (animation_frame.signals != null) {
                let signals = animation_frame.signals.split(" ")
                return signals.map( signal => {
                    return {
                        id: signal,
                        sender_id: actor.id,
                        sender_type: 'actor'
                    }
                })
            }
            return []
        })

    // Flatten the array
    actor_signals = [].concat(...actor_signals)

    return actor_signals
}

