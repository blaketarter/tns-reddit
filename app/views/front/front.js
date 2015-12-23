"use strict";

var http = require('fetch');
var dialog = require("ui/dialogs");
var observable = require("data/observable");
var observableArray = require("data/observable-array");
var moment = require('moment');

var view = require("ui/core/view");
var actionBarModule = require("ui/action-bar");
var listViewModule = require("ui/list-view");
var labelModule = require("ui/label");
var stackLayoutModule = require("ui/layouts/stack-layout");
var imageModule = require("ui/image");

var enums = require("ui/enums");
var orientation = enums.Orientation;

var page;
var posts = [];

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
          post.data.created = formatDate(post.data.created_utc);
          posts.push(post.data);
        });

        console.log(posts);

        pageData.posts = new observableArray.ObservableArray(posts);

        buildListView(view.getViewById(page, 'list-layout'), pageData.posts);
      });
};

function formatDate(rawDate) {
  return moment(rawDate * 1000).fromNow();
}

function buildListView(pageView, posts) {
  var listView = new listViewModule.ListView();
  listView.items = posts;
  listView.on(listViewModule.ListView.itemLoadingEvent, function(args) {
    if (!args.view) {
      let post = posts.getItem(args.index);
      args.view = buildListItem(post);
    }
  });

  pageView.addChild(listView);
  pageView.refresh();
}

function buildStackLayout(dir, children, className) {
  var stackLayout = new stackLayoutModule.StackLayout();
  stackLayout.orientation = orientation[dir];

  if (children) {
    for (let child of children) {
      stackLayout.addChild(child);
    }
  }

  if (className) {
    stackLayout.className = className;
  }

  return stackLayout;
}

function buildListItem(post) {
  /*
   * return buildStackLayout('vertical', [
   *   buildTitlePart(post),
   *   buildStackLayout('horizontal', [
   *     buildLabel(post.author, 'author'),
   *     buildLabel(post.created, 'created'),
   *     buildLabel(post.subreddit, 'subreddit')
   *   ], 'info')
   * ], 'post');
   */
  let listItem;

  switch (post.post_hint) {
    case 'link':
      listItem = buildLinkPost(post);
      break;
    case 'self':
      listItem = buildSelfPost(post);
      break;
    case 'image':
      listItem = buildImagePost(post);
      break;
    default:
      listItem = buildLinkPost(post);
  }

  return listItem;
}

function buildCachedImage(src, className) {
  let image = new imageModule.Image();
  image.src = src;
  if (className) {
    image.className = className;
  }

  return image;
}

function buildTitlePart(post) {
  var titlePart = [];

  if (post.thumbnail && post.thumbnail.length) {
    titlePart.push(buildCachedImage(post.thumbnail, 'image'));
  } else {
    console.log('no image');
  }

  titlePart.push(buildLabel(post.title, 'title'));

  return buildStackLayout('horizontal', titlePart, 'top');
}

function buildLabel(text, className) {
  let label = new labelModule.Label();
  label.text = text;

  if (className) {
    label.className = className;
  }

  return label;
}

function buildBorder(children, className) {

}

function buildSelfPost(post) {
  return buildStackLayout('vertical', [
    buildStackLayout('vertical', [
      buildLabel(post.title, 'title')
    ], 'title-stack'),
    buildStackLayout('horizontal', [
      buildLabel(post.author, 'author'),
      buildLabel(post.created, 'created'),
      buildLabel(post.subreddit, 'subreddit')
    ], 'info')
  ], 'post link-post');
}

function buildLinkPost(post) {
  return buildStackLayout('vertical', [
    buildStackLayout('vertical', [
      buildLabel(post.title, 'title')
    ], 'title-stack'),
    buildStackLayout('horizontal', buildTitlePart(post), 'link-stack'),
    buildStackLayout('horizontal', [
      buildLabel(post.author, 'author'),
      buildLabel(post.created, 'created'),
      buildLabel(post.subreddit, 'subreddit')
    ], 'info')
  ], 'post link-post');
}

function buildImagePost(post) {
  return buildStackLayout('vertical', [
  ], 'post image-post');
}
