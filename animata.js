
function ValidateStates(ad) {
    var has_at_least_one_state = ad.states != null && Object.keys(ad.states).length > 0
    var failure_reason = null
    if (has_at_least_one_state) {
        var has_one_default_state = Object.keys(ad.states).find((key) => { return ad.states[key].default_state == true; }) != null
        if (has_one_default_state) {
            // valid!
        } else {
            failure_reason = "Must have one state marked default_state"
        }
    } else {
        failure_reason = "Must have at least one state"
    }
    return { valid: failure_reason == null, failure_reason: failure_reason }
}

function ValidateActorModel(ad) {
    var state_res = ValidateStates(ad)
    if (state_res.valid) {
    } else {
    }
    return state_res
}

// 
// Given a groups dictionary, this will return an array of strings of all the groups
// that contain the given search_state_name.
//
function FilteredGroupsThatIncludeState(groups, search_state_name) {
    var filtered_groups = []
    for (var key in groups) {
        if (groups.hasOwnProperty(key)) {
            if (groups[key].filter( (state_name) => { return state_name == search_state_name } ).length > 0) {
                filtered_groups.push(key)
            }
        }
    }
    return filtered_groups
}

function StringArraysHaveCommonElements(first, second) {
    return first.find( (n) => { return second.indexOf(n) != -1 } ) != null
}

//
// Takes a model of an actor and its current state, and given an array of inputs (directions),
// returns the next actor state.
//
// Actor state consists of
// - state_name
// - frame_index
// - other properties
//
// Actor model consists of
// - states dictionary: one or more states, keyed by name of state
// - transitions array: zero or more transitions
// - groups dictionary: zero or more groups, keyed by name of group
// - default_state: string
//
// A state is
// - frames array: one or more frames
// - next: string of the next state to go to after displaying last frame
//
// A transition describes transitions from one state/frame_index to another state
// - from: string describing which state to match against. this can be
//     "any" indicating matches any state
//     a group name, indicating match a group
//     a state name, indicating only match a given state
// - excluding: an array of one or more state names or groups to ignore when matching
// - input: an array of input directions to match against (must have one or more entries)
// - to: string, name of state to transition to if matches
// - no_reset: true/false indicating not to reset the frame index when transitioning to
//   the "to" state. (Useful when matching a frame in the middle of a sequence.)
//
// A frame is an object that represents the actor in the game world for a single frame.
// The attributes of a frame do not matter to Animata as it doesn't need to process the
// contents in any way. Typically, the frame object contains information that is useful
// for rendering a frame of animation on the screen and properties useful to the game
// world's rules (ex: if character is attacking, its attack level, defense level, etc.).
//
// A group is an array of state names. It is used to group similar states together.
//
// "inputs" is an array of strings describing inputs applied to the actor on this frame.
//
// The new state returned is a copy of the current state with the state_name and frame_index replaced.
//
function NextActorState(model, actor_state, inputs) {
    var groups = FilteredGroupsThatIncludeState(model.groups, actor_state.state_name)
    var animation_state = model.states[actor_state.state_name]

    var matching_transition = model.transitions.find( (transition) => {
        var is_any_state = transition.from == "any"
        var matches_group_name = groups.find( (group) => { return group == transition.from } ) != null
        var matches_state_name = transition.from == actor_state.state_name
        var directions_match = StringArraysHaveCommonElements(inputs, transition.input)

        var state_is_excluded = false
        if (transition.excluding != null) {
            state_is_excluded = transition.excluding.reduce((acc, name) => {
            return acc || (name == actor_state.state_name || (groups.find( (group) => { group == name } )))
            }, false)
        }

        return (is_any_state || matches_group_name || matches_state_name) && directions_match && !state_is_excluded
    })

    var next_state_name = actor_state.state_name
    var next_frame_index = actor_state.frame_index

    if (matching_transition != null) {
        var next_state = model.states[matching_transition.to]
        if (next_state != null) {
            next_state_name = matching_transition.to
            if (matching_transition.no_reset != true) {
                next_frame_index = 0
            } else {
                next_frame_index = next_frame_index + 1
                if (next_frame_index >= next_state.frames.length) {
                    next_frame_index = 0
                }
            }
        } else {
            // State doesn't exist, go to default
            next_state_name = model.default_state
            next_frame_index = 0
        }
    } else {
        next_frame_index = actor_state.frame_index + 1
        if (next_frame_index >= animation_state.frames.length) {
            if (animation_state.next != null) {
                next_state_name = animation_state.next
            } else {
                next_state_name = model.default_state
            }
            next_frame_index = 0
        }
    }

    var new_actor_state = {...actor_state}
    new_actor_state.state_name = next_state_name
    new_actor_state.frame_index = next_frame_index

    return new_actor_state
}
