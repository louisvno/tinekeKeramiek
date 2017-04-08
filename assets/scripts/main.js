
//load data from firebase
function loadData () {
    var database = firebase.database().ref("/posts/");
    
    database.once("value").then(function(dataObj){
        renderView(dataObj.val());
    });
}

function renderView(data){
    console.log("data loaded")
    loadPosts(data);
}

function loadPosts(data) {
    $.get('/templates/card.mst', function(template) {
        var renderTmpl = Handlebars.compile(template);
        var html = renderTmpl(data);
    $('#main-gallery').html(html);
  });
}
