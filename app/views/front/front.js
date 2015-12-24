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
// var borderModule = require("ui/border");
var buttonModule = require("ui/button");

var enums = require("ui/enums");
var utilityModule = require("utils/utils");
var orientation = enums.Orientation;

var frontPage = 'https://www.reddit.com/.json';
var page;
var posts = [];
var lastPageId = '';
var loadMore;
var loading = false;

// var testData = require('../../data/front');

var pageData = new observable.Observable({
    posts: new observableArray.ObservableArray([
    ])
});

exports.loaded = function(args) {
    page = args.object;
    page.bindingContext = pageData;

    http.fetch(frontPage)
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        lastPageId = data.data.after;
        pageData.posts = new observableArray.ObservableArray(posts);

        buildPostData(data);
        buildListView(view.getViewById(page, 'list-layout'), pageData.posts);
      });
};

function buildPostData(raw) {
  raw.data.children.map(function(post) {
    post.data.created = formatDate(post.data.created_utc);
    pageData.posts.push(post.data);
  });
}

function formatDate(rawDate) {
  return moment(rawDate * 1000).fromNow();
}

function buildListView(pageView, posts) {
  var listView = new listViewModule.ListView();
  listView.items = posts;
  
  listView.on(listViewModule.ListView.itemLoadingEvent, function(args) {
    args.view = buildListItem(posts.getItem(args.index));
  });

  listView.on(listViewModule.ListView.itemTapEvent, function(args) {
    let post = posts.getItem(args.index);

    if (post.url && post.url.length) {
      utilityModule.openUrl(post.url);
    }
  });

  listView.on(listViewModule.ListView.loadMoreItemsEvent, function(args) {
    if (!loading) {
      loading = true;
      http.fetch(frontPage + '?count=25&after=' + lastPageId)
        .then(function(response) {
          return response.json();
        })
        .then(function(data) {
          lastPageId = data.data.after;
          buildPostData(data);
          loading = false;
        });
    }
  });

  pageView.addChild(listView);
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

  /*
   * if (post.thumbnail && post.thumbnail.length) {
   *   titlePart.push(buildCachedImage(post.thumbnail, 'image'));
   * } else {
   *   console.log('no image');
   * }
   */

  titlePart.push(buildLabel(post.title, 'title'));

  return buildStackLayout('horizontal', titlePart, 'top');
}

function buildLinkPart(post) {
  var linkPart = [];

  /*
   * if (post.thumbnail && post.thumbnail.length) {
   *   linkPart.push(buildCachedImage(post.thumbnail, 'image'));
   * } else {
   *   console.log('no image');
   * }
   */
  
  linkPart.push(buildLabel(post.domain, 'domain'));
  linkPart.push(buildLabel(post.url, 'url'));

  return linkPart;
}

function buildLabel(text, className, textWrap) {
  let label = new labelModule.Label();
  label.text = text;

  if (className) {
    label.className = className;
  }

  if (textWrap) {
    label.textWrap = true;
  }

  return label;
}

/*
 * function buildBorder(child, width, className) {
 *   let border = new borderModule.Border();
 *   
 *   border.width = width;
 * 
 *   if (className) {
 *     border.className = className;
 *   }
 * 
 *   border.content = child;
 * 
 *   return border;
 * }
 */

function buildSelfPost(post) {
  return buildStackLayout('vertical', [
    buildStackLayout('vertical', [
      buildLabel(post.title, 'title', true)
    ], 'title-stack'),
    buildStackLayout('horizontal', [
      buildLabel(post.score, 'score'),
      buildLabel(post.author, 'author'),
      buildLabel(post.created, 'created'),
      buildLabel(post.subreddit, 'subreddit')
    ], 'info')
  ], 'post link-post');
}

function buildLinkPost(post) {
  return buildStackLayout('vertical', [
    buildStackLayout('vertical', [
      buildLabel(post.title, 'title', true)
    ], 'title-stack'),
    buildStackLayout('vertical', buildLinkPart(post), 'link-stack'),
    buildStackLayout('horizontal', [
      buildLabel(post.score, 'score'),
      buildLabel(post.author, 'author'),
      buildLabel(post.created, 'created'),
      buildLabel(post.subreddit, 'subreddit')
    ], 'info')
  ], 'post link-post');
}

function buildImagePost(post) {
  return buildStackLayout('vertical', [
    buildStackLayout('vertical', [
      buildLabel(post.title, 'title', true)
    ], 'title-stack'),
    buildStackLayout('horizontal', [
      buildCachedImage(post.thumbnail, 'image')
    ], 'image-stack'),
    buildStackLayout('horizontal', [
      buildLabel(post.score, 'score'),
      buildLabel(post.author, 'author'),
      buildLabel(post.created, 'created'),
      buildLabel(post.subreddit, 'subreddit')
    ], 'info')
  ], 'post image-post');
}

function addLoadMore() {}
function removeLoadMore() {}
