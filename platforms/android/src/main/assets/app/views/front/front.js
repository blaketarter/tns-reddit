"use strict";

var http = require('fetch');
var dialog = require("ui/dialogs");
var observable = require("data/observable");
var observableArray = require("data/observable-array");
var view = require("ui/core/view");
var actionBarModule = require("ui/action-bar");
var moment = require('moment');
var page;

var pageData = new observable.Observable({
    posts: new observableArray.ObservableArray([
    ])
});

exports.loaded = function(args) {
    page = args.object;
    page.bindingContext = pageData;

    http.fetch('https://www.reddit.com/.json')
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        data.data.children.map(function(post) {
          post.data.created = moment(post.data.created_utc * 1000).fromNow();
          pageData.posts.push(post);
        });

        setTimeout(() => {

return;
          var postElems = view.getViewById(page, 'posts');
          console.log(postElems);
        
          for (let post of postElems._map.values()) {
            console.log(post);
            if (!post._subViews[0]._subViews[0]._url || !post._subViews[0]._subViews[0]._url.length) {
              console.log('no url');
              post._subViews[0].removeChild(post._subViews[0]._subViews[0]);
              
              setTimeout(() => {
                post._subViews[0]._subViews[0].left = 12;
              }, 0);
            }
          }
        }, 0);
      });
};

