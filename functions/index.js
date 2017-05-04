const functions = require('firebase-functions');
const admin = require('firebase-admin');
const gcs = require('@google-cloud/storage')();
const spawn = require('child-process-promise').spawn;
 // Create and Deploy Your First Cloud Functions
 // https://firebase.google.com/docs/functions/write-firebase-functions
admin.initializeApp(functions.config().firebase);

exports.generateThumbnail = functions.storage.object().onChange(event => {
    const object = event.data; // The Storage object.
    const fileBucket = object.bucket; // The Storage bucket that contains the file.
    const filePath = object.name; // File path in the bucket.
    const contentType = object.contentType; // File content type.
    const resourceState = object.resourceState; // The resourceState is 'exists' or 'not_exists' (for file/folder deletions).

    // Download file from bucket.
    const bucket = gcs.bucket(fileBucket);
    const tempFilePath = "/tmp/${fileName}";
    
    // Exit if this is triggered on a file that is not an image.
    if (!contentType.startsWith('image/')) {
      console.log('This is not an image.');
      return;
    }

    // Get the file name.
    const fileName = filePath.split('/').pop();
    
    //Get postId
    const postId = filePath.split('/').shift();

    // Exit if the image is already a thumbnail.
    if (fileName.startsWith('thumb_')) {
      console.log('Already a Thumbnail.');
      return;
    }

    // Exit if this is a move or deletion event.
    if (resourceState === 'not_exists') {
      console.log('This is a deletion event.');
      return;
    }
    
    return bucket.file(filePath).download({destination: tempFilePath})
    .then(() => {
      console.log('Image downloaded locally to', tempFilePath);
      // Generate a thumbnail using ImageMagick.
      return spawn('convert', [tempFilePath, '-thumbnail', '200x200>', tempFilePath])
      })
    .then(() => {
      console.log('Thumbnail created at', tempFilePath);
      // We add a 'thumb_' prefix to thumbnails file name. That's where we'll upload the thumbnail.
      const thumbFilePath = filePath.replace(/(\/)?([^\/]*)$/, `$1thumb_$2`);
      // Uploading the thumbnail.
      //docs https://googlecloudplatform.github.io/google-cloud-node/#/docs/storage/1.1.0/storage/bucket?method=upload
      return bucket.upload(tempFilePath, { destination: thumbFilePath });
    
    }).then((img) => {
      //write thumbnail data to database
        return img[0].getMetadata();
      //NOTES urls in the metadata are not accessible by firebase app/user
      //TODO get the url through admin and filepath and then write to db
      //docs https://googlecloudplatform.github.io/google-cloud-node/#/docs/storage/1.1.0/storage/file?method=getMetadata
      //docs 
    }).then((metaData) => {
        return admin.database()
               .ref('thumbs/' + postId)
               .push({//name: imgData[0].metadata.name,
                      //publishDate: imgData[0].metadata.timeCreated,
                     // storagePath: imgData[0].metadata.fullPath,
                      url: metaData[0] });
    })
    .then(()=> {console.log("great success")})
    .catch((error)=>{console.log(error.message)});
});
