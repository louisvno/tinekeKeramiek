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
          var imgName=images[i].files[0].name ;
          var img = images[i].files[0];
          imgArr.push(getStorageRef(cloudStorage, postId, imgName).put(img));
        }
    }
    return imgArr;
}
//first uppload all images, then push to db
function sendPost(cloudStorage, database){ 
    var images = getFiles();
    var postRef = getPostRef(database);
    
    var storeImags = storeImages(cloudStorage, images, postRef.postId);
    
    Promise.all(storeImags).then(function(result) {
        //write post data
        var d = new Date();
        var imgData = writeImgData(images, d.toUTCString(), postRef.postId);
        var postData = writePostData("9229", d.toUTCString(), getFormInput,imgData);
        //post to db
        postRef.path.set(postData);
        
    }).catch(function(error){
        console.log("There was an error, please try again")
    });
}


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

function writeImgData(images, date,postId){
    var imgObj = {};
    for (var i=0;i < images.length; i++) {
      if(images[i].files.length > 0){ 
          var imgName = images[i].files[0].name;
          var data =   {
                            name: imgName,
                            publishDate: date,
                            storagePath: postId + "/" + imgName
                       };
          imgObj["img" + i] = data;
      }
    }
    return imgObj;
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
