const UUID = require("uuid/v4");
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
    const tempFilePathx500 = "/tmp/${fileName}_500";
    const tempFilePathx1000 = "/tmp/${fileName}_1000";
    const tempFilePathThumb = "/tmp/${fileName}.png";
    // Exit if this is triggered on a file that is not an image.
    if (!contentType.startsWith('image/')) {
      console.log('This is not an image.');
      return;
    }

    // Get the file name.
    const fileName = filePath.split('/').pop();
    //Get postId
    const postId = filePath.split('/').shift();
    //Generate custom uuid to be able to reference in database
    const uuid500 = UUID();
    const uuid1000 = UUID();
    const uuidThumb = UUID();
    // Exit if the image is already a thumbnail.
    if (fileName.startsWith('x500_') || fileName.startsWith('x1000_')|| fileName.startsWith('thumb_')) {
      console.log('Already Processed.');
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
        // Resize image using ImageMagick.
        return Promise.all([spawn('convert',[ tempFilePath,'-strip', '-resize', '500x500>', tempFilePathx500]),
                            spawn('convert',[ tempFilePath,'-strip', '-resize', '1000x1000>', tempFilePathx1000]),
                            spawn('convert',[ tempFilePath,'-strip','-quality','80', '-thumbnail', '150x150>', 'PNG8:'+tempFilePathThumb])
                            ]);
        })
      .then(() => {
        // Add a 'preview_' prefix to thumbnails file name. That's where we'll upload the thumbnail.
        const newFilePathx500 = filePath.replace(/(\/)?([^\/]*)$/, `$1x500_$2`);
        const newFilePathx1000 = filePath.replace(/(\/)?([^\/]*)$/, `$1x1000_$2`);
        const newFilePathThumb = filePath.replace(/(\/)?([^\/]*)$/, `$1thumb_$2`) +".png";
        // Uploading the thumbnail.
        //docs https://googlecloudplatform.github.io/google-cloud-node/#/docs/storage/1.1.0/storage/bucket?method=upload
        return Promise.all([bucket.upload(tempFilePathx500, {  
                                        destination: newFilePathx500,
                                        metadata: {
                                                  metadata:{firebaseStorageDownloadTokens: uuid500},
                                                  contentType: 'image/jpeg'
                                                  }                                   
                                        }), 
                            bucket.upload(tempFilePathx1000, {  
                                              destination: newFilePathx1000,
                                              metadata: {
                                                    metadata:{firebaseStorageDownloadTokens: uuid1000},
                                                    contentType: 'image/jpeg'
                                                    }                                    
                                            }),
                            bucket.upload(tempFilePathThumb, {  
                                              destination: newFilePathThumb,
                                              metadata: {
                                                    metadata:{firebaseStorageDownloadTokens: uuidThumb},
                                                    contentType: 'image/png'
                                                    }                                    
                                            }) 
                            ]);
      }).then((imgs)=>{
      /*** 
      *get the metdata of uploaded img
      *@docs https://googlecloudplatform.github.io/google-cloud-node/#/docs/storage/1.1.0/storage/file?method=getMetadata
      *file = data[0];
      ***/
        return Promise.all([imgs[0][0].getMetadata(), imgs[1][0].getMetadata(), imgs[2][0].getMetadata()]);

      }).then((metaData) => {
      
          var ref= admin.database().ref(functions.config().database.x500path + "/" +postId + "/");
          var key = ref.push().key;
              //write thumb metadata to firebase database
          //generate the download url with uuid
            return Promise.all([admin.database()
                                   .ref(functions.config().database.x500path + "/" +postId + "/" + key)
                                   .set({
                                          timeCreated: metaData[0][0].timeCreated,
                                          path: metaData[0][0].name,
                                          downloadUrl: "https://firebasestorage.googleapis.com/v0/b/" + metaData[0][0].bucket + "/o/" +        encodeURIComponent(metaData[0][0].name) + "?alt=media&token=" + uuid500 
                                          }),
                                admin.database()
                                   .ref(functions.config().database.x1000path + "/" + postId + "/" + key)
                                   .set({
                                          timeCreated: metaData[1][0].timeCreated,
                                          path: metaData[1][0].name,
                                          downloadUrl: "https://firebasestorage.googleapis.com/v0/b/" + metaData[1][0].bucket + "/o/" +        encodeURIComponent(metaData[1][0].name) + "?alt=media&token=" + uuid1000 
                                          }),
                                 admin.database()
                                   .ref(functions.config().database.thumbpath + "/" +postId +"/" + key)
                                   .set({
                                          timeCreated: metaData[2][0].timeCreated,
                                          path: metaData[2][0].name,
                                          downloadUrl: "https://firebasestorage.googleapis.com/v0/b/" + metaData[2][0].bucket + "/o/" +        encodeURIComponent(metaData[2][0].name) + "?alt=media&token=" + uuidThumb
                                          })
                                ]);
            })
          
      .then(()=> {console.log("great success")})
      .catch((error)=>{console.log(error.message)});
});
