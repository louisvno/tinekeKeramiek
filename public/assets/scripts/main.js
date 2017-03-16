var cloudStorage = firebase.storage();
var database = firebase.database();


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

//.set(postData);

function getImg () {
    return document.getElementById('file1').files[0];
}

function sendPost(cloudStorage, database){ 
    
    var postRef = getPostRef(database);
    var storeImg = getStorageRef(cloudStorage, postRef.postId, "fileName.txt").put(getImg());
    
    storeImg.then(function(snapshot) {
                    //write post data
                    var link =snapshot.downloadURL;
                    var d = new Date();
                    var data = writePostData("9229", d.toUTCString(), getFormInput, link , "Hello", "world")
                    //post to db
                    postRef.path.set(data);
                    });
}

function getFormInput() {
    return {
        text : "hehh",
        title: "hehe",
        category : "music",
    };
}

function writePostData(userId, publishDate, formInput, imgLink, imgName, imgDesc){
    return {
        userId : userId,
        publishDate : publishDate,
        text : formInput.text || "",
        title: formInput.title || "",
        category : formInput.category || "",
        images : {
                img1 : {
                        link: imgLink,
                        name:   imgName,
                        desc: imgDesc
                        } 
                 }
    };
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
