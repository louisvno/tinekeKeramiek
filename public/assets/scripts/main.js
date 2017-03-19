var cloudStorage = firebase.storage();
var database = firebase.database();

/*
* get reference (filepath) from Firebase to upload file to
*/
function getStorageRef (cloudStorage, folderName, fileName){ 
    return cloudStorage.ref().child(folderName + "/" + fileName);
}

function getPostRef(database){
    var postId = database.ref().child("posts").push().key;
    var path = database.ref("posts/" + postId)

    return  { postId: postId,
              path:  path
              }
}

function getFiles () {
    return document.querySelectorAll("input[type=file]");
}

/*
* Returns an array of promises
*/
function storeImages(cloudStorage, images, postId ){
    var imgArr = [];
    
    for (var i=0;i < images.length; i++) {
        if(images[i].files.length > 0){  
          var imgName = images[i].files[0].name ;
          var file = images[i].files[0];
          imgArr.push(getStorageRef(cloudStorage, postId, imgName).put(file));
        }
    }
    return Promise.all(imgArr);
}

//first uppload all images, then push data to db
function sendPost(cloudStorage, database){ 
    var images = getFiles();
    var postRef = getPostRef(database);
    
    var storeImgs = storeImages(cloudStorage, images, postRef.postId)
                    .then(function (result){
                        var imgData ={};
                        for (var i=0;i < result.length; i++) {
                          if(images[i].files.length > 0){ 
                            var data =   {
                                        name: result[i].metadata.name,
                                        publishDate: result[i].metadata.timeCreated,
                                        storagePath: result[i].metadata.fullPath,
                                        url: result[i].downloadURL
                                       };
                            imgData["img" + i] = data;
                            }
                        }
                        return imgData;
                    });

    var storeData = function (imgData) {
          if (!isEmptyObj(imgData)){ 
            var d = new Date();
            var postData = writePostData("user_id", d.toUTCString(), getFormInput(),imgData);
            //post to db
            //also a promise
            postRef.path.set(postData);
          } else {
            throw new Error("data object empty");
          }
    }
    
    storeImgs.then(storeData);
 }
//    storeImgs.then(function (result){
//         
//        for (var i=0;i < result.length; i++) {
//          if(images[i].files.length > 0){ 
//            var data =   {
//                        name: result[i].metadata.name,
//                        publishDate: result[i].metadata.timeCreated,
//                        storagePath: result[i].metadata.fullPath,
//                        url: result[i].downloadURL
//                       };
//            imgData["img" + i] = data;
//            }
//        }
//        
//        if (!isEmptyObj(imgData)){ 
//            var d = new Date();
//            var postData = writePostData("user_id", d.toUTCString(), getFormInput(),imgData);
//            //post to db
//            //also a promise
//            postRef.path.set(postData);
//        }
//    });
//}


function getFormInput() {
    return {
        text : "Beschrijving",
        title: "Vrolijke vogels",
        category : "Dieren",
    };
}

function writePostData(userId, date, formInput, imgData){
    return {
        userId : userId,
        publishDate : date,
        text : formInput.text || "",
        title: formInput.title || "",
        category : formInput.category || "",
        images : imgData
    };
}
//returns a promise off all img download links
//function getFileURLs(cloudStorage,images, postId){
//    var imgURLs = [];
//    
//    for (var i=0;i < images.length; i++) {
//      if(images[i].files.length > 0){ 
//         var imgName = images[i].files[0].name;
//         imgURLs.push(getStorageRef(cloudStorage, postId, imgName).getDownloadURL());
//        }   
//    }
//    return Promise.all(imgURLs).then(function (URLs) {
//       return URLs;
//    });
//}

function writeImgData(cloudStorage,images, date, postId){
   var imgObj = {};
   var imgURLs = [];
   
//   for (var i=0;i < images.length; i++) {
//      if(images[i].files.length > 0){ 
//         var imgName = images[i].files[0].name;
//         imgURLs.push(getStorageRef(cloudStorage, postId, imgName).getDownloadURL());
//        }   
//    }
    
//    Promise.all(imgURLs).then(function(url){ 
//        for (var i=0;i < images.length; i++) {
//          if(images[i].files.length > 0){ 
//            var data =   {
//                        name: images[i].files[0].name,
//                        publishDate: date,
//                        storagePath: postId + "/" + images[i].files[0].name,
//                        url: url[i]
//                       };
//            imgObj["img" + i] = data;
//            }
//        }
//        return imgObj;  
//        
//      }).catch(function(error){
//        throw new Error("failed to get downloadurl");
//      });
}

function isEmptyObj(obj){
    return Object.keys(obj).length < 1;
}


//var postData = writePostData(28,2992,"hello","world","music",[{link:"lll",name:"koll",desc:"kjkd"}])

// var updates = {};
//  updates['/posts/' + postId] = postData;



// Try to create a user for ada, but only if the user id 'ada' isn't
// already taken
//var adaRef = firebase.database().ref('users/ada');
//adaRef.transaction(function(currentData) {
//  if (currentData === null) {
//    return { name: { first: 'Ada', last: 'Lovelace' } };
//  } else {
//    console.log('User ada already exists.');
//    return; // Abort the transaction.
//  }
//}, function(error, committed, snapshot) {
//  if (error) {
//    console.log('Transaction failed abnormally!', error);
//  } else if (!committed) {
//    console.log('We aborted the transaction (because ada already exists).');
//  } else {
//    console.log('User ada added!');
//  }
//  console.log("Ada's data: ", snapshot.val());
//});
