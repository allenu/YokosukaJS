
var key_state = {}

function ClearKeyState() {
    key_state = {}
}

function GetKeyState() {
    return key_state
}

function HandleKeyDown(evt) {
    switch (evt.keyCode) {
    case 65: // 'a'
        key_state.a_key = true
        break;
    case 83: // 's'
        key_state.s_key = true
        break;
    case 74: // 'j'
        key_state.j_key = true
        break;
    case 75: // 'k'
        key_state.k_key = true
        break;
    case 38:  /* Up arrow was pressed */
        key_state.up = true
        break;
    case 40:  /* Down arrow was pressed */
        key_state.down = true
        break;
    case 37:  /* Left arrow was pressed */
        key_state.left = true
        break;
    case 39:  /* Right arrow was pressed */
        key_state.right = true
        break;
    default:
        console.log("Don't know that key: " + evt.keyCode);
        break;
    }
}

function HandleKeyUp(evt) {
    switch (evt.keyCode) {
    case 65: // 'a'
        key_state.a_key = false
        break;
    case 83: // 's'
        key_state.s_key = false
        break;
    case 74: // 'j'
        key_state.j_key = false
        break;
    case 75: // 'k'
        key_state.k_key = false
        break;
    case 38:  /* Up arrow was pressed */
        key_state.up = false
        break;
    case 40:  /* Down arrow was pressed */
        key_state.down = false
        break;
    case 37:  /* Left arrow was pressed */
        key_state.left = false
        break;
    case 39:  /* Right arrow was pressed */
        key_state.right = false
        break;
    }
}
