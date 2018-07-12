
function ScriptIsExecutable(script, signals_fired) {
    // See if this script's signal predicate matches
    let required_signals = []
    if (script.signals) {
        // More than one signal must match
        required_signals = script.signals
    } else {
        required_signals = [script.signal]
    }

    let matching_signals = required_signals.reduce( (accumulator, required_signal) => {
        let filtered_signals = signals_fired.filter( signal => {
            let matches_sender_id = (required_signal.sender_id == null || required_signal.sender_id == signal.sender_id)
            // TODO: Do we need sender_type? We could just assume that if a signal is fired at all, that that's good enough
            // and then use script.command.target_type to make sure it only gets sent to that particular object type.
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
    return (matching_signals.length == required_signals.length)
}

