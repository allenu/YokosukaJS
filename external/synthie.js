// SynthieJS by Allen Ussher -- https://github.com/allenu/SynthieJS

var kSineWave = 0
var kTriangleWave = 1
var kSquareWave = 2
var kSawtoothWave = 3
var kNoiseWave = 4
var kSilence = 5

var kSynthesizerAction_PlayTone = 0
var kSynthesizerAction_ReleaseTone = 1

// Limit theta to 0.0 to 2xPI. This assumes theta >= 0.0.
function Mod2Pi(theta) {
    while (theta >= 2.0*Math.PI) {
        theta -= 2.0*Math.PI
    }
    return theta
}

function normalize_angle(theta) {
    if (theta < 0) {
        let multiples = theta / (2.0*Math.PI)
        theta += (2.0*Math.PI) * (multiples + 1)
    }
    theta = Mod2Pi(theta)
    return theta
}

function sawtooth(theta) {
    theta = normalize_angle(theta)

    if (theta < Math.PI ) {
        return theta / Math.PI
    } else {
        return -1.0 + (theta - Math.PI) / Math.PI
    }
}

//
// Triangle wave
//
function triwave(theta) {
    theta = normalize_angle(theta)
    
    if (theta < Math.PI / 2.0) {
        return theta / (Math.PI / 2.0)
    } else if (theta < 3.0 * Math.PI / 2.0) {
        return 1.0 - 2.0 * (theta - (Math.PI / 2.0)) / Math.PI
    } else {
        return (theta - 3.0 * Math.PI / 2.0) / (Math.PI / 2.0)
    }
}

// Duty cycle = 0.0 to 1.0
function squarewave(theta, duty_cycle) {
    theta = normalize_angle(theta)
    
    if (theta < 2.0*Math.PI*duty_cycle)
        return 1.0
    else
        return -1.0   
}

function noisewave(theta) {
    theta = normalize_angle(theta)

    let sample = Math.random()*2 - 1
    
    return sample
}

// Oscillates from -1 to +1
function f_oscillator_sample(oscillator_type, freq, start_time, time) {
    let normalized_time = time - start_time
    let theta = 2.0 * Math.PI * freq * normalized_time

    switch(oscillator_type) {
        case kSineWave:
            return Math.sin(theta)

        case kTriangleWave:
            return triwave(theta)

        case kSquareWave:
            return squarewave(theta, 0.70)

        case kSawtoothWave:
            return sawtooth(theta)

        case kNoiseWave:
            return noisewave(theta)

        case kSilence:
            return 0.0

        default:
            return 0.0
    }
}

function f_envelope_gain(envelope, note_released, note_release_time, time) {
    if (time < 0.0) {
        return 0.0
    }

    if (time < envelope.attack_time) {
        let gain = envelope.attack_gain * time / envelope.attack_time
        return gain
    }

    // Normalize to start of decay time, which is the end of attack_time
    let decay_time = time - envelope.attack_time

    // See if we're in the decay phase
    if (decay_time < envelope.decay_time) {
        let gain_drop = (envelope.attack_gain - envelope.sustain_gain)
        let gain = envelope.attack_gain - gain_drop * (decay_time / envelope.decay_time)
        return gain
    }

    // If we got past decay phase, we must either be sustaining, releasing, or no longer playing
    // TODO: We'll support non-sustainable later. Assume everything
    // sustains for now.

    // See if we're still in the sustain phase
    if (!note_released || time < note_release_time) {
        return envelope.sustain_gain
    }

    // If got here, we must be releasing or no longer playing (post-release)

    // Normalize to release time
    let release_time = time - note_release_time

    // See if we're still releasing
    if (release_time < envelope.release_time) {
        let gain_drop = envelope.sustain_gain
        let gain = envelope.sustain_gain - gain_drop * (release_time / envelope.release_time)
        return gain
    }

    // We must be in post-release phase
    return 0.0
}

function f_instrument_sample(instrument, freq, note_play_time, note_released, note_release_time, time) {
    let oscillator_sample = f_oscillator_sample(instrument.oscillator, freq, note_play_time, time)

    // Translate time into a time in the envelope's timeline (where time 0.0 is where the note starts playing).
    let envelope_time = time - note_play_time
    let envelope_note_release_time = note_release_time - note_play_time
    let envelope_gain = f_envelope_gain(instrument.envelope, note_released, envelope_note_release_time, envelope_time)

    let sample = oscillator_sample * envelope_gain
    return sample;
}
//
// Get a sample for the given synthesizer state at a given time.
//
// - synthesizer_state: the synthesizer state, which specifies how many channels there are, what instrument they're playing,
//   at what frequency, what envelope they're using, and when the tone started (and possibly ended) playing.
// - time: the time, in seconds, of the sample to get
//
function f_synthesizer_sample(synthesizer, time) {
    // Our "mixing" of audio is super simple: just take the average of all of the channels
    let avg_sample = 0.0
    for (var i=0; i < synthesizer.channels.length; i++) {
        let channel = synthesizer.channels[i];
        let instrument_sample = f_instrument_sample(channel.instrument, channel.freq, channel.note_play_time,
                    channel.note_released, channel.note_release_time, time)

        avg_sample += instrument_sample
    }
    if (synthesizer.num_channels > 0) {
        avg_sample = avg_sample / synthesizer.num_channels
    }

    return avg_sample
}

// Given a set of synth commands, update the synth state. The only way to change a synth's state is through
// this function.
//
// - prev_state: the previous synthesizer state
// - num_commands: how many commands to execute on the synth
// - commands: an array of the commands that will change the synth state
//
function f_next_synthesizer_state(prev_state, commands) {
    let next_state = {...prev_state}

    for (var i=0; i < commands.length; i++) {
        let command = commands[i]

        switch (command.action_type) {
            case kSynthesizerAction_PlayTone:
                next_state.channels[command.channel].instrument = command.instrument
                next_state.channels[command.channel].freq = command.freq
                next_state.channels[command.channel].note_play_time = command.time
                next_state.channels[command.channel].note_released = false
                break

            case kSynthesizerAction_ReleaseTone:
                next_state.channels[command.channel].note_release_time = command.time
                next_state.channels[command.channel].note_released = true
                break

            default:
                console.log("Bad command")
        }
    }
    return next_state
}

function f_create_empty_synthesizer() {
    let envelope = {
        attack_time: 0.5,
        attack_gain: 1.0,
        decay_time: 0.2,
        sustain_gain: 0.8,
        release_time: 1.0,
    }

    let silence = {
        oscillator: kSilence,
        envelope: envelope,
    }

    let channels = [
        {
            instrument: silence,
            freq: 440,
            note_play_time: 0.0,
            note_released: true,
            note_release_time: 5.0,
        },
        {
            instrument: silence,
            freq: 350,
            note_play_time: 0.0,
            note_released: true,
            note_release_time: 5.0,
        },
        {
            instrument: silence,
            freq: 60,
            note_play_time: 2.0,
            note_released: true,
            note_release_time: 4.0,
        },
        {
            instrument: silence,
            freq: 120,
            note_play_time: 2.0,
            note_released: true,
            note_release_time: 1.0,
        },
    ]

    let synth = {
        num_channels: 4,
        channels: channels
    }
    return synth
}

