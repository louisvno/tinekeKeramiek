function Component (render,async,wait){
    this.render = render;
    this.async = async;
    this.wait = wait;
}
//component name actually main galley
var views = [{
      pathName: "index.html",
      components: [new Component(loadPostsAsync.bind(null,getMostRecentPosts(12)),true,false),
                   new Component(renderFooter,false,true)]
  	},
    {
      pathName: "info.html",
      components: [new Component(renderInfoPage,false,false),
                   new Component(renderFooter,false,true)]
  	},
//    {
//      pathName: "werk/dierfiguren.html",
//      components: [Component(renderPostCards.bind(null,getPostsByCat("dierfiguren")),true,false),
//                   Component(renderFooter,false,true)]
//  	},
//    {
//      pathName: "werk/schalen.html",
//      components:[Component(renderPostCards.bind(null,getPostsByCat("schalen")),true,false),
//                   Component(renderFooter,false,true)]
//  	}
 ];

//@ pageload
dispatcher(getUrl());
//@ link click
document.addEventListener("click", function(e){
    if(event.target.tagName.toLowerCase() === 'a')
    {
      e.preventDefault();
      dispatcher(event.target.href); //this is the url where the anchor tag points to.
    }
})
//TODO @ popstate

//Firebase Queries
function getMostRecentPosts (limit){
   return firebase.database().ref("/posts/").limitToLast(limit).once("value");
} 

function getImgsByPostKey(folderName, postKey) {
   return firebase.database().ref("/" + folderName + "/" + postKey).once("value");
}

function getUrl (path){
    var pathName ="";
    //get url
    if (path){ 
      var p = new URL(path); //NOTE this does not work in IE!!
      pathName = p.pathname ;
    } else {
      pathName = window.location.pathname;
    }
    clearView();
    return pathName.split("/").pop();
}

function clearView(){
  var components = document.getElementsByClassName("component");
    for(var i=0; i < components.length; i++){
        components[i].style.display = "none";
    } 
}

function renderInfoPage(){
    showComponent("about-me");
}

function renderPostCards(posts){
    var template = document.getElementById("gallery-temp").innerHTML;
    var renderTmpl = Handlebars.compile(template);
    var html = renderTmpl(posts);
    document.getElementById('main-gallery').innerHTML=html;
    showComponent('main-gallery');
}

function renderFooter(){
   showComponent("footer");
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

function showComponent (id){ 
    document.getElementById(id).style.display = "block";
}

//general view renderfunction
function renderView(view) {
  var queue = [];
  var asyncP = [];
  //Control rendering order based on component properties "wait" and "async"
  for (var i = 0; i < view.components.length; i++) {
    var component = view.components[i];

    if (component.async) {
      asyncP.push(component.render());
    } else if (!component.async && !component.wait) {
      component.render();
    } else {
      queue.push(component);
    }
  }
  //queue executes after all async components are rendered
  Promise.all(asyncP).then(function() {
    queue.forEach(function(comp) {
      comp.render();
    });
  })
}

function dispatcher(getUrl) {
  var pathName = this.getUrl();
  var v = views.filter(function(view) {
    return view.pathName == pathName;
  })
	if (v != null && v.length == 1){
  	renderView(v[0]);
  }else if (v != null && v.length >1){
  	throw new Error ("path could not be resolved: path duplicate");
  } else {
  	throw new Error ("path could not be resolved: does not exist");
  }
  
}