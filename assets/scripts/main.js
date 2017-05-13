
function getImgsByPostKey (folderName, postKey) {
   return firebase.database().ref("/" + folderName + "/" + postKey).once("value");
}

function loadModelMainPage() { 
    var dataModel = {};
    return firebase.database().ref("/posts/").limitToLast(12).once("value")
        .then(function (posts){
            dataModel.posts = posts.val();
            var imgs=[];
            Object.keys(dataModel.posts).forEach(function(postKey){
                imgs.push(getImgsByPostKey("x500Imgs", postKey));
            })
            return Promise.all(imgs)
        }).then(function (imgsRes){ 
            for(var i=0; i < imgsRes.length;i++){
                var obj = imgsRes[i].val();
                if(obj){ 
                  var imgKey = Object.keys(obj)[0];
                  var postKey = obj[imgKey].path.split("/").shift();
                  dataModel.posts[postKey].x500 =  obj[imgKey] ;
                }
            }
            return dataModel;
        }).catch(function(error){console.log(error)}) ;
}

function loadModelMainPageAsync() { 
    var dataModel = {};
    return firebase.database().ref("/posts/").limitToLast(12).once("value")
        .then(function (posts){
            dataModel.posts = posts.val();
            renderPostCards(dataModel);
            var imgs=[];
            Object.keys(dataModel.posts).forEach(function(postKey){
                imgs.push(getImgsByPostKey("x500Imgs", postKey));
            })
            return Promise.all(imgs)
        }).then(function (imgsRes){ 
            dataModel.images = {};
            for(var i=0; i < imgsRes.length;i++){
                var obj = imgsRes[i].val();
                if(obj){ 
                  var imgKey = Object.keys(obj)[0];
                  var postKey = obj[imgKey].path.split("/").shift();
                //  dataModel.posts[postKey].x500 =  obj[imgKey] ;   
                  dataModel.images[postKey] =  obj;
                  var url = dataModel.images[postKey][imgKey].downloadUrl;
                  var img = document.querySelector('[data-postkey=' + postKey+"]" + " img");
                  img.src =url;
                }
            }
            return dataModel;
        }).catch(function(error){console.log(error)}) ;
}

loadModelMainPageAsync().then(function (data){
  console.log("hello")

 //   Object.keys(data.posts).forEach(function(postKey){
//        var url = data.images[postKey];
//        var img = document.querySelector("div[data-postkey]=" + postKey );
//        
//    })
    
//    $.get('/templates/card.mst', function(template) {
//        var renderTmpl = Handlebars.compile(template);
//        var html = renderTmpl(data);
//    $('#main-gallery').html(html);
//    })
    
})

function renderPostCards(posts){
    var template = document.getElementById("gallery-temp").innerHTML;
    var renderTmpl = Handlebars.compile(template);
    var html = renderTmpl(posts);
    document.getElementById('main-gallery').innerHTML=html;

}
    
 

