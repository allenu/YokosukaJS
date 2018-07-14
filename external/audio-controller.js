
var g_sampleRate = 44100
var g_audioNode = null
var g_gainNode = null
var g_fullGain = 0.5
var g_audioContext
var g_audio_time = 0.0
var g_bufferSize = 4096
var g_bufferTime = 1.0 * g_bufferSize / g_sampleRate
var g_synthesizer = null
 
function SetupAudio() {
    console.log("Setting up audio...")

    g_audio_time = 0.0

    var audioContext
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext
        audioContext = new AudioContext()
        // TODO: this doesn't seem to have an effect. It's always 44.1kHz.
        // audioContext.sampleRate = g_sampleRate
        g_audioContext = audioContext
    } catch(e) {
      alert('Web Audio API is not supported in this browser');
    }

    g_synthesizer = f_create_empty_synthesizer()
        
    // Create a pcm processing "node" for the filter graph.
    // https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createScriptProcessor
    g_audioNode = audioContext.createScriptProcessor(g_bufferSize, 1, 1);
    // g_audioNode.sampleRate = g_sampleRate
    g_audioNode.onaudioprocess = function(e) {
        var output = e.outputBuffer.getChannelData(0)
        for (var i = 0; i < g_bufferSize; i++) {
            let audio_time = g_audio_time + i * 1.0 / g_sampleRate
            let sample = f_synthesizer_sample(g_synthesizer, audio_time)
            output[i] = sample
        }
        g_audio_time = g_audio_time + g_bufferTime
    }

    g_gainNode = audioContext.createGain()
    g_gainNode.gain.value = g_fullGain
    g_gainNode.connect(audioContext.destination)

    g_audioNode.connect(g_gainNode)
}

function TearDownAudio() {
    g_audioContext.close()
    g_audioContext = null
    g_synthesizer = null
}

