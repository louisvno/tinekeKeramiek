
var provider = new firebase.auth.GoogleAuthProvider();
//validations : no 2 files same name, title,category,
document.getElementById("send-post").addEventListener("click",function (e){
    var cloudStorage = firebase.storage();
    var database = firebase.database();
    
    e.preventDefault();
    
    if (isFormValid()){
        sendPost(cloudStorage, database);
    }
    //if validate
    //send
});

firebase.auth().signInWithPopup(provider).then(function(result) {
  //  initComponents();
}).catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
  // The email of the user's account used.
  var email = error.email;
  // The firebase.auth.AuthCredential type that was used.
  var credential = error.credential;
  // ...
});
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
    var imgs = [];
    if (images.length > 0){ 
        for (var i=0;i < images.length; i++) {
            if(images[i].files.length > 0){  
              var imgName = images[i].files[0].name ;
              var file = images[i].files[0];
              imgs.push(getStorageRef(cloudStorage, postId, imgName).put(file));
            }
        }
        return Promise.all(imgs);
    } else {
     throw new Error ("No files selected")
    }
}
/*
*Function to send a new blog post and it's images
*First uploads all images to cloud storage, then push data to db
*/
function sendPost(cloudStorage, database){ 
    var images = getFiles();
    var postRef = getPostRef(database);
    //NOTE "then" also returns a promise, takes callback as parameter with one argument > fullfilment value
    storeImages(cloudStorage, images, postRef.postId)
        .then(function (imgData){
           if (!isEmptyObj(imgData)){ 
                var d = new Date();
                var postData = writePostData("user_id", d.toUTCString(), getFormInput(),imgData); 
                //post to db returns Promise
                return postRef.path.set(postData);
           }else {
                throw new Error("Upload failed");
           }
        })
        .then(function (imgData){
            console.log("Upload success!")
        }).catch(function(error){
            console.log(error.message);
        });   
 }

function getFormInput() {
    return {
        text : document.getElementById("post-text").value,
        title: document.getElementById("post-title").value,
        category : document.getElementById("post-category").value
    };
}

function writePostData(userId, date, formInput, imgData){
    var imgDataObj ={};
    var images = getFiles();
    
    for (var i=0;i < imgData.length; i++) { 
        var obj =   {
                    name: imgData[i].metadata.name,
                    publishDate: imgData[i].metadata.timeCreated,
                    storagePath: imgData[i].metadata.fullPath,
                    url: imgData[i].downloadURL
                   };
        imgDataObj["img" + i] = obj;
    }; 
    
    return {
        userId : userId,
        publishDate : date,
        text : formInput.text || "",
        title: formInput.title || "",
        category : formInput.category || "",
        images : imgDataObj
    };
}


function isEmptyObj(obj){
    return Object.keys(obj).length < 1;
}

function isFormValid(){
    if (checkFormInput()){
        return true;
    } else return false;
    //if files do not have same name
    //at least one file selected
    
}

function checkFileNames(){
    
}

function checkFormInput(){
    var formInput = getFormInput();
    if (formInput.text && formInput.title && formInput.category != "default"){
        return true;
    }
    else return false ; 
}

