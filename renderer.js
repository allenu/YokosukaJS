
function setpixelated(context){
    context['imageSmoothingEnabled'] = false;       /* standard */
    context['mozImageSmoothingEnabled'] = false;    /* Firefox */
    context['oImageSmoothingEnabled'] = false;      /* Opera */
    context['webkitImageSmoothingEnabled'] = false; /* Safari */
    context['msImageSmoothingEnabled'] = false;     /* IE */
}

//
// RenderSprites - Render a list of sprites to an HTML5 canvas.
//
// canvas:		HTML5 canvas element
// sprites:		an array of sprite dictionaries.
//			sprite:
//			- image: image path for use in image_lookup
//			- src_position: {x:,y:} cutout image position in image
//			- src_size: {width:,height:} cutout image size in image
//			- position: {x:,y:} coordinates to draw to in canvas
//			- scale: multiplier to scale width and height of image
//			- size: {width:,height:} optional size to render (if scale is missing)
//			- flip: if true, horizontally flips image
//
// - This will clear the canvas before drawing.
// 

function RenderSprites(canvas, sprites, do_not_clear_screen) {
  var context = canvas.getContext("2d")
  setpixelated(context)
    if (do_not_clear_screen) {
    } else {
	context.clearRect(0, 0, canvas.width, canvas.height);
    }

  sprites.forEach((sprite) => {
    if (sprite.image != null) {
	var flip_factor = (sprite.flip ? -1.0 : 1.0)

	context.save()
	if (sprite.flip) {
	    context.translate(canvas.width,0);
	    context.scale(-1.0, 1.0)
	}

	var src_position = sprite.src_position
	var src_size = sprite.src_size

	src_position = src_position != null ? src_position : { x: 0, y: 0 }
	src_size = src_size != null ? src_size : { width: sprite.image.width, height: sprite.image.height }

    var canvas_image_width = 0
    var canvas_image_height = 0

    if (sprite.scale != null) {
        canvas_image_width = src_size.width * sprite.scale.x
	    canvas_image_height = src_size.height * sprite.scale.y
    } else {
        canvas_image_width = sprite.size.width
	    canvas_image_height = sprite.size.height
    }
	var canvas_x = sprite.position.x
	var canvas_y = sprite.position.y

	if (sprite.flip) {
	    canvas_x = canvas.width - (canvas_x + canvas_image_width)
	}

	var old_alpha = context.globalAlpha
	if (sprite.alpha != null) {
	    context.globalAlpha = sprite.alpha
	}

	context.drawImage(sprite.image, 
			  src_position.x, src_position.y, src_size.width, src_size.height, 
			  canvas_x, canvas_y, 
			  canvas_image_width, canvas_image_height)

	context.globalAlpha = old_alpha

	context.restore()
    } else {
      console.log("Error: image missing: " + sprite.image)
    }
  })
}
