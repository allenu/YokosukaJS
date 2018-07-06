# YokosukaJS

YokosukaJS is a simple functional programming-style beat-em-up game engine written in JavaScript.

See it in action in your browser here:

https://www.ussherpress.com/yokosukajs/

# How to try it

Clone the project, then just open index.html in your browser. That's it. It runs completely in the browser.

# How it works

- A game world is made up of "actors"
- Each actor takes direction from a "director"
- A direction is a simple list of commands (ex: "punch", "walk forward", "kick")
- Each actor has a "model" (see resources/model.yaml) that defines the animations for each state (ex: standing, punching, walking forward), and the allowed transitions between states, given a direction
- An image (i.e. the "spritesheet", see images/ folder) defines the actual animation images used for a given actor
- A spritesheet definition (resources/spritesheet.json) describes the rectangles to cut out the sprites from the spritesheet, as well as the anchor point origin to use when rendering the sprite in the game world

The game executes Tick() to cycle a state update to the game world. Since the engine is written in a functional manner, this takes as input the previous state as well as user inputs to create the next world state.

The renderer takes the latest world state and renders all the actors and billboards (i.e. static images that make up the background) on screen using an HTML Canvas.

![Screenshot](/images/screenshot.png)

