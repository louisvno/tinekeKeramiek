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
    var imgs = [];
    
    for (var i=0;i < images.length; i++) {
        if(images[i].files.length > 0){  
          var imgName = images[i].files[0].name ;
          var file = images[i].files[0];
          imgs.push(getStorageRef(cloudStorage, postId, imgName).put(file));
        }
    }
    return Promise.all(imgs);
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
        .catch(function (error){
            console.log(error.message);
        })
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
           if (!isEmptyObj(imgData)){ 
          //move date to write func
                var d = new Date();
                var postData = writePostData("user_id", d.toUTCString(), getFormInput(),imgData); 
                //post to db returns Promise
                return postRef.path.set(postData);
           }else {
                throw new Error("No files selected");
           }
           })
        .then(function (imgData){
            console.log("upload success!")
        }).catch(function(error){
            console.log(error.message);
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


function isEmptyObj(obj){
    return Object.keys(obj).length < 1;
}


