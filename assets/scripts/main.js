initApp();

function initApp(){
  this.app = new App();
  dispatcher();
};

//Component class
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
    this.postPath = "/test_posts/";
    this.imgx500path = "test_x500Imgs";
    this.thumbsPath = "test_thumbnails"
    //test vars
    //this.postPath = "/test_posts/";
    //this.imgx500path = "test_x500Imgs";
    this.views = [{
          pathName: "/",
          components: [new Component(null,"intro",false,false),
          new Component(loadPostCardsAsync.bind(null,getMostRecentPosts.bind(null,12)),"main-gallery",true,false),
                       new Component(null,"footer",false,true)]
        },{
          pathName: "/index.html",
          components: [new Component(null,"intro",false,false),new Component(loadPostCardsAsync.bind(null,getMostRecentPosts.bind(null,12)),"main-gallery",true,false),
                       new Component(null,"footer",false,true)]
        },{
          pathName: "/info.html",
          components: [new Component(null,"about-me",false,false),
                       new Component(null,"footer",false,true)]
        },{
          pathName: "/werk/schalen.html",
          components: [new Component(loadPostCardsAsync.bind(null,getPostsByCat.bind(null,"schalen")),"main-gallery",true,false),
                      new Component(null,"footer",false,true)]
        },{
          pathName: "/werk/dierfiguren.html",
          components:[new Component(loadPostCardsAsync.bind(null,getPostsByCat.bind(null,"dierfiguren")),"main-gallery",true,false),
                       new Component(null,"footer",false,true)]
        },{
          pathName: "/werk/anderwerk.html",
          components:[new Component(loadPostCardsAsync.bind(null,getPostsByCat.bind(null,"anderwerk")),"main-gallery",true,false),
                      new Component(null,"footer",false,true)]
        },{
          pathName: "/werk/{category}/{postId}",
          components:[new Component(loadPostDetails,"work-details",true,false),
                      new Component(loadThumbs,"thumb-container",true,false),
                      new Component(loadPostImg,"highlighted",true,false),
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
      };
      
     this.clearView = function(){
        var components = document.getElementsByClassName("component");
          for(var i=0; i < components.length; i++){
              components[i].style.display = "none";
          } 
     };

 }
 
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
    if(event.target.hasAttribute('data-img-id')){
       var imgId = event.target.getAttribute('data-img-id');
       var postId = window.location.pathname.split("/").pop();
       getx500ById(postId,imgId).then(function(data){
          var imgObj = data.val();
          document.getElementById('highlighted').setAttribute('src',imgObj.downloadUrl);
       })
    }
    
});
//when user uses forward of backward button of browser
window.onpopstate = function(event) {
  dispatcher();
};

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
            },"");
        case 4: 
            pathName.splice(2,2,"/{category}/","{postId}");
            return pathName.reduce(function(str1,str2){
               return  str1 + str2;
            },"");
    }
}

function dispatcher() {
  var pathName = getPathName();
  var v = app.views.filter(function(view) {
    return view.pathName == ("/"+ pathName);
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
    var wrapper = document.querySelector(".post-wrapper");
    
    if (wrapper == null){
      wrapper = document.createElement('div');
      wrapper.classList.add('post-wrapper');
    }
    
    wrapper.innerHTML = html;   
    document.getElementById('main-gallery').appendChild(wrapper);
}
//TODO break up this function?
//@param postQuery = query to firebase (Promise)
function loadPostCardsAsync(postQuery) { 
    var dataModel = {};
    return postQuery()
        .then(function (posts){
            dataModel.posts = posts.val();
            renderPostCards(dataModel);
            var imgs=[];
            Object.keys(dataModel.posts).forEach(function(postKey){
                imgs.push(getImgsByPostKey(app.imgx500path, postKey));
            })
            return Promise.all(imgs)
        }).then(function (imgsRes){ 
            dataModel.images = {};
            for(var i=0; i < imgsRes.length;i++){
                var obj = imgsRes[i].val();
                if(obj){ 
                  var imgKey = Object.keys(obj)[0];
                  var postKey = obj[imgKey].path.split("/").shift();   
                  dataModel.images[postKey] =  obj;
                  var url = dataModel.images[postKey][imgKey].downloadUrl;
                  var img = document.querySelector('[data-postkey=' + postKey+"]" + " img");
                  img.src =url;
                }
            }
            return dataModel;
        }).catch(function(error){console.log(error)}) ;
}

function loadPostDetails (){
    var postId = window.location.pathname.split("/").pop();
    return getPostById(postId).then(function(data){
       var post = data.val();
       document.getElementById("post-details-title").innerHTML=post.title;
       document.getElementById("post-details-desc").innerHTML=post.text;
    });
}

function loadPostImg(){
    var postId = window.location.pathname.split("/").pop();
    return getx500ByPostId(postId).then(function(data){
      data.forEach(function(img){
          var imgv = img.val();
          document.getElementById("highlighted").src = imgv.downloadUrl;
        return true;
      })
      
    });
}
//TODO thumbs should have img x500 id
function loadThumbs(postId){
  var postId = window.location.pathname.split("/").pop();
  
  return getThumbsByPostId(postId).then(function(data){
          var container=document.getElementById("thumb-container");
          container.innerHTML = "";
          data.forEach(function(thumbnail){
              var thumb = thumbnail.val();      
              var myImg = new Image(150, 150);
              myImg.src = thumb.downloadUrl;
              var div = document.createElement("div");
              div.classList.add('col-xxs-3', 'col-xs-6', 'col-sm-6', 'col-md-6');
              myImg.setAttribute('data-img-id', thumbnail.key);
              div.appendChild(myImg);
              container.appendChild(div);
          });
      });
}

//Firebase Queries
function getMostRecentPosts (limit){
   return firebase.database().ref(app.postPath).limitToLast(limit).once("value");
} 

function getImgsByPostKey(folderName, postKey) {
   return firebase.database().ref("/" + folderName + "/" + postKey).once("value");
}

function getPostsByCat(category){
   return firebase.database().ref(app.postPath).orderByChild("category").equalTo(category).once("value");
}

function getPostById(id){
   return firebase.database().ref(app.postPath + id).once("value");
}

function getThumbsByPostId(postId){
   return firebase.database().ref(app.thumbsPath + "/" + postId).once("value");
}

function getx500ByPostId(postId){
   return firebase.database().ref(app.imgx500path +"/"+ postId).once("value");
}

function getx500ById(postId,imgId){
   return firebase.database().ref(app.imgx500path +"/"+ postId + "/" + imgId).once("value");
}