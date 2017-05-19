var siteMap ={
    index : {
            src : "index.html",
            componentIds : ["main-gallery"] 
            },
    werk: { 
            schalen : {componentIds : ["schalen"]},
            dierfiguren : {componentIds : ["dierfiguren"]},
            anderwerk : {componentIds : ["anderwerk"]}            
          },
    info: { src : "info.html",
            componentIds : ["about-me"]
          }
    };

viewController();

document.addEventListener("click", function(e){
    
    if(event.target.tagName.toLowerCase() === 'a')
    {
      e.preventDefault();
      viewController(event.target.href); //this is the url where the anchor tag points to.
    }

})

window.onpopstate = function (event) {
//    var parsedUrl = getUrl().split("/").pop().replace("%20"," ");
    var state = event.originalEvent.state;
};

function getMostRecentPosts (limit){
   return firebase.database().ref("/posts/").limitToLast(limit).once("value");
} 

function getImgsByPostKey(folderName, postKey) {
   return firebase.database().ref("/" + folderName + "/" + postKey).once("value");
}

function viewController (path){
    var pathName ="";
    //get url
    if (path){ 
      var p = new URL(path); //NOTE this does not work in IE!!
      pathName = p.pathname ;
    } else {
      pathName = window.location.pathname;
    }
    //hide everything in the view
    clearView();
    //parse url
    var pathItems = pathName.split("/");
    switch(pathItems.length){
      case 1 :
          //renderhomepage
          renderHomePage();
          break;
      case 2 :
          //dispatcher
          switch (pathItems[1]){
             case "" || siteMap.index.src :
                 renderHomePage();
                 break;
             case siteMap.info.src :
                 renderInfoPage();
                 break;
             }
          break;   
      case 3 :
        //dispatcher
          break;
    }
}

function clearView(){
  var components = document.getElementsByClassName("component");
    for(var i=0; i < components.length; i++){
        components[i].style.display = "none";
    } 
}

function renderInfoPage(){
    showComponents(siteMap.info.componentIds);
}


function renderHomePage(){ 
    showComponents(siteMap.index.componentIds);
    loadPostsAsync( getMostRecentPosts(12) ).then(function (data){
        showComponents(["footer"]);
    });
}

//@param postQuery = query to firebase (Promise)
function loadPostsAsync(postQuery) { 
    var dataModel = {};
    return postQuery
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



function renderPostCards(posts){
    var template = document.getElementById("gallery-temp").innerHTML;
    var renderTmpl = Handlebars.compile(template);
    var html = renderTmpl(posts);
    document.getElementById('main-gallery').innerHTML=html;
}

function showComponents (components){ 
  for(var i=0; i < components.length;i++){ 
    document.getElementById(components[i]).style.display = "block";
  }
}

