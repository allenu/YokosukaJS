
function LoadImage(image_path, callback) {
  var img = new Image()
  img.onload = () => {
    // console.log("Loaded image: " + image_path + " as " + img)
    callback({ image_path: image_path, image: img })
  }
  img.onerror = () => {
    callback({ image_path: image_path })
  }
  img.src = image_path
}

function LoadImagePromise(image_path) {
  return new Promise( (fulfill, reject) => {
    LoadImage(image_path, (res) => {
      if (res.image != null) {
        // console.log("fulfilled image: " + res.image_path)
        fulfill(res)
      } else {
        console.log("failed to load image " + res.image_path)
        reject()
      }
    })
  })
}

//
// Given an array of image paths, this will return a dictionary of all the images keyed by the paths provided.
// This fails if at least one image failed to load.
// 
function LoadImageLookupWithPathsPromise(image_paths) {
    return new Promise( (fulfill, reject) => {
        let loadImagePromises = image_paths.map( (image_path) => { return LoadImagePromise(image_path) } )

        Promise.all(loadImagePromises).then( (images) => {
            var image_lookup = images.reduce( (acc, image) => { 
            if (image.image != null) {
                //console.log("loading image " + image.image_path)
            }
            let acc_copy = acc
            acc_copy[image.image_path] = image.image
            return acc_copy }, {} )

            fulfill(image_lookup)
        }, () => {
            reject()
        })
    })
}
