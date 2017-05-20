//@param render: function (optional), renders component to screen
//@param id: string, HTML id
//@param async: boolean, if loaded async
//@param wait: boolean, if component has to wait for others rendering
function Component (render,id,async,wait){
    this.render = render;
    this.id = id;
    this.async = async;
    this.wait = wait;
    
    this.show =function (){ 
      document.getElementById(this.id).style.display = "block";
    }
}

function App(){
    this.views = [{
          pathName: "",
          components: [new Component(loadPostsAsync.bind(null,getMostRecentPosts(12)),"main-gallery",true,false),
                       new Component(null,"footer",false,true)]
        },{
          pathName: "index.html",
          components: [new Component(loadPostsAsync.bind(null,getMostRecentPosts(12)),"main-gallery",true,false),
                       new Component(null,"footer",false,true)]
        },{
          pathName: "info.html",
          components: [new Component(null,"",false,false),
                       new Component(null,"footer",false,true)]
        },{
          pathName: "werk/schalen.html",
          components: [new Component(loadPostsAsync.bind(null,getPostsByCat("schalen")),"main-gallery",true,false),
                      new Component(null,"footer",false,true)]
        },{
          pathName: "werk/dierfiguren.html",
          components:[new Component(loadPostsAsync.bind(null,getPostsByCat("dierfiguren")),"main-gallery",true,false),
                       new Component(null,"footer",false,true)]
        },{
          pathName: "werk/anderwerk.html",
          components:[new Component(loadPostsAsync.bind(null,getPostsByCat("anderwerk")),"main-gallery",true,false),
                      new Component(null,"footer",false,true)]
        }

     ];
     
     //general view renderfunction
     this.renderView = function(view) {
        var queue = [];
        var asyncP = [];
        this.clearView();
        //Control rendering order based on component properties "wait" and "async"
        for (var i = 0; i < view.components.length; i++) {
          var component = view.components[i];

          if (component.async) {
              asyncP.push(component.render());
              component.show();
          } else if (!component.async && !component.wait) {
              if(component.render){
                component.render();
                component.show();
              }else component.show();
          } else {
              if(component.render) queue.push(component.render());
              else queue.push(component);
          }
        }
        //queue executes after all async components are rendered
        Promise.all(asyncP).then(function() {
          queue.forEach(function(comp) {
            comp.show();
          });
        })
      }
      
     this.clearView = function(){
        var components = document.getElementsByClassName("component");
          for(var i=0; i < components.length; i++){
              components[i].style.display = "none";
          } 
     }
 }
 
//Init app
var app = new App();
dispatcher();

//Event handlers
document.addEventListener("click", function(e){
    if(event.target.tagName.toLowerCase() === 'a')
    {
      e.preventDefault();
      if(event.target.pathname != "/werk"){
        window.history.pushState(null,"",event.target.pathname); //this is the url where the anchor tag points to.
        dispatcher();
        }
    }
});

//TODO @ popstate

function getPathName (){
    var pathName = window.location.pathname.split("/");
    switch (pathName.length) {
        case 1 :
            return pathName.pop();
        case 2 : 
            return pathName.pop();
        case 3 : 
            pathName.splice(2,0,"/");
            return pathName.reduce(function(str1,str2){
               return  str1 + str2;
            },"")
    }
}

function dispatcher() {
  var pathName = getPathName();
  var v = app.views.filter(function(view) {
    return view.pathName == pathName;
  })
	if (v != null && v.length == 1){
  	app.renderView(v[0]);
  }else if (v != null && v.length >1){
  	throw new Error ("path could not be resolved: path duplicate");
  } else {
  	throw new Error ("path could not be resolved: does not exist");
  } 
}


function renderPostCards(posts){
    var template = document.getElementById("gallery-temp").innerHTML;
    var renderTmpl = Handlebars.compile(template);
    var html = renderTmpl(posts);
    var wrapper = document.createElement('div');
    
    wrapper.classList.add('wrapper');
    wrapper.innerHTML = html;   
    document.getElementById('main-gallery').appendChild(wrapper);
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

//Firebase Queries
function getMostRecentPosts (limit){
   return firebase.database().ref("/posts/").limitToLast(limit).once("value");
} 

function getImgsByPostKey(folderName, postKey) {
   return firebase.database().ref("/" + folderName + "/" + postKey).once("value");
}

function getPostsByCat(category){
   return firebase.database().ref("/posts/").limitToLast(4).once("value");
}

