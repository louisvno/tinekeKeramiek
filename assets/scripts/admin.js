
var provider = new firebase.auth.GoogleAuthProvider();
var profile = {
    //production
    //postPath = "posts";
    //Test
    postPath : "test_posts"
};
    

document.getElementById("send-post").addEventListener("click",function (e){
    var cloudStorage = firebase.storage(),
    database = firebase.database(),
    loader = document.querySelector('.loader'),
 		sendButton = document.getElementById('send-post'),
    logMsg = document.getElementById("logmsg");
      
    e.preventDefault();
    
    if (isValidForm()){
          logMsg.style.display='none';
          loader.style.display= 'inline-block';
          loader.classList.add('spin');
          sendButton.disabled = true;
        
        sendPost(cloudStorage, database).then(function (message){ 
          loader.style.display= 'none';
          logMsg.style.color='green';
          logMsg.innerHTML= message;  
          logMsg.style.display='inline';
          sendButton.disabled = false;
      	})
      .catch(function (error){
        	loader.style.display= 'none';
          logMsg.innerHTML= error.message;
          logMsg.style.display='inline';
          logMsg.style.color='red';
          sendButton.disabled = false;
        });
    }
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
    var postId = database.ref().child(profile.postPath).push().key;
    var path = database.ref(profile.postPath + "/" + postId)

    return  { postId: postId,
              path:  path
              }
}

/*
* Function that uploads a series of files to firebase
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

    return storeImages(cloudStorage, images, postRef.postId)
        .then(function (imgData){
           if (!isEmptyObj(imgData)){ 
                var date = new Date();
                var postData = writePostData("user_id", date.toUTCString(), getFormInput(),imgData); 
                //post to db returns Promise
                return postRef.path.set(postData);
           }else {
                throw new Error("Upload failed");
           }
        })
        .then(function (imgData){
            clearForm();
            return "Upload success!";
        }).catch(function(error){
            throw error;
        });   
 }

function getFormInput() {
    return {
        text : document.getElementById("post-text").value,
        title: document.getElementById("post-title").value,
        category : document.getElementById("post-category").value
    };
}

function clearForm(){
  document.getElementById("post-text").value="";
  document.getElementById("post-title").value="";
  document.getElementById("post-category").selectedIndex="0";
  var fileFields = getFiles();
  for (var i=0; i< fileFields.length;i++){
     fileFields[i].value ="";
  }
}

function getFiles () {
    return document.querySelectorAll("input[type=file]");
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


/*
*   Validation functions
*/

function isEmptyObj(obj){
    return Object.keys(obj).length < 1;
}

function isValidForm(){
    return (formNotEmpty() && validateFileNames())
}

function formNotEmpty(){
    var formInput = getFormInput();
    if (formInput.text && formInput.title && formInput.category != "default"){
        return true;
    }
    else return false ; 
}

function validateFileNames(){
    var files = getFiles();
    
    if (files.length > 0){   
        var fileNames=[];
        var isUnique = true;      
        
        for (var i=0; i < files.length; i++){
            var fileName = files[i].value.split("\\").pop().toLowerCase();      
            if (fileName.length>0){ 
                if (isDuplicate(fileName,fileNames)){
                    isUnique = false;
                    break;
                } else{
                    fileNames.push(fileName);
                }
            }
        }
        return isUnique;   
    } 
    else return false;
}

function isDuplicate(fileName, fileNames){
    if (fileNames.length == 0){
        return false;
    }   
    
    if (fileNames.indexOf(fileName) === -1){
        return false;
    } else if (fileNames.indexOf(fileName) > -1){
        return true;
    }
}


