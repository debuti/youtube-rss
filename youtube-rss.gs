//Youtube subs to RSS Feeds - Google Apps Script
//Script by Borja Garcia <debuti@gmail.com>
//Based on Twitter RSS Feeds written by Amit Agarwal (@labnol) on 03/19/2013
////Fetch from yt subscriptions and emit them as RSS
//GPL
//v0.0.1 - 20160121
//
//Changelog:
//v0.0.1 -20160121- Initial version
//

var CACHETIME= 600;

/**
*/
function sendLinks() {
  var url = ScriptApp.getService().getUrl();
  
  if (url) {
    var msg = "";
    
    msg += "Sample RSS Feeds for Youtube\n";
    msg += "============================";
    
    MailApp.sendEmail(Session.getActiveUser().getEmail(), "Youtube RSS Feeds", msg);
  }
}


/**
*/
function doGet(e) {
  var url = ScriptApp.getService().getUrl();
  var id = Utilities.base64Encode(url);
  
  var cache = CacheService.getPublicCache();
  var rss   = cache.get(id);
  
  if (!rss) {
    var output = ytSubsRecentVideos();
   
    rss = jsonToRss(output, url);
    
    cache.put(id, rss, CACHETIME);
  }
  
  return ContentService.createTextOutput(rss)
  .setMimeType(ContentService.MimeType.RSS);
}


/**
*/
function ytSubsRecentVideos() {  
  var result = new Array();
  
  var nextPageToken = "";
  var subscriptions = 0;
  while (nextPageToken != null) {
    var channels = YouTube.Subscriptions.list('id,snippet', {
      mine: true,
      maxResults: 50,
      order: 'alphabetical',
      pageToken: nextPageToken
    });
    subscriptions += channels.items.length;
    
    for (var i = 0; i < channels.items.length; i++) {
      var channel = channels.items[i];
      var channelTitle = channel.snippet.title;
      var channelId = channel.snippet.resourceId.channelId;
      var channelURL = "https://www.youtube.com/channel/"+channelId
      //Logger.log('Channel: %s %s', channelTitle, channelId);
      
      var videos = YouTube.Search.list('id,snippet', {
        channelId: channelId,
        maxResults: 3,
        order: 'date'
      });
      
      for (var j = 0; j < videos.items.length; j++) {
        var video = videos.items[j];
        var videoTitle = video.snippet.title;
        var videoDescription = video.snippet.description;
        var videoId = video.id.videoId;
        var videoURL = "https://youtu.be/"+videoId;
        var videoPublishedAt = video.snippet.publishedAt;
        //Logger.log('Video: %s VideoID: %s VideoTime: %s', videoTitle, videoId, videoPublishedAt);
        result.push({videoId: videoId, 
                     videoTitle: videoTitle, 
                     videoDescription: videoDescription, 
                     videoURL: videoURL, 
                     videoPublishedAt: videoPublishedAt, 
                     channelTitle: channelTitle, 
                     channelId:channelId, 
                     channelURL:channelURL})
      }
    }
    
    nextPageToken = channels.nextPageToken;
  }
  
  Logger.log("You are subscribed to %s awesome channels, with %s videos", subscriptions, result.length);
  
  //for  (var i = 0; i < 5; i++) Logger.log("Video " + i + ": " + result[i].videoTitle);
  result.sort(function(a, b) {
                a = new Date(a.videoPublishedAt);
                b = new Date(b.videoPublishedAt);
                return a>b ? -1 : a<b ? 1 : 0;
              });
  result = result.slice(0, 10);
  //for  (var i = 0; i < 5; i++) Logger.log("Sortedvideo " + i + ": " + result[i].videoTitle);
  return result;
}



/**
*/
function jsonToRss(items, feed) {
  
  function htmlentities(str) {
    str = str.replace(/&/g, "&amp;");
    str = str.replace(/>/g, "&gt;");
    str = str.replace(/</g, "&lt;");
    str = str.replace(/"/g, "&quot;");
    str = str.replace(/'/g, "&#039;");
    return str;
  }
  
  try {
    if (items) {
      var len = items.length;
      
      var rss = "";
      
      if (len) {
        rss = '<?xml version="1.0"?>'+"\n"
        rss += '<rss version="2.0">'+"\n";
        rss += ' <channel>'+"\n";
        rss += '  <title>' + "Yt subscription feeds" + '</title>'+"\n";
        rss += '  <link>' + htmlentities(feed) + '</link>'+"\n";
        rss += '  <description>' + "Youtube feed made by Google apps script. Updatable every " + CACHETIME + " seconds" + '</description>'+"\n";
        var today = new Date();
        rss += '  <pubDate>' + today.toUTCString() + '</pubDate>'+"\n";
        
        for (var i = 0; i < len; i++) {
          var link = items[i].videoURL;
          var channelTitle = htmlentities(items[i].channelTitle);
          var title = htmlentities(items[i].videoTitle);
          var date = new Date(items[i].videoPublishedAt);
          var id = items[i].videoId;
          var description = htmlentities(items[i].videoDescription);
                    
          rss += "  <item>"+"\n"
          rss += "   <title>" + channelTitle + ": " + title + "</title>"+"\n";
          rss += "   <pubDate>" + date.toUTCString() + "</pubDate>"+"\n";
          rss += "   <guid isPermaLink='false'>" + id + "</guid>"+"\n";
          rss += "   <link>" + link + "</link>"+"\n";
          rss += "   <description>" + description + "</description>"+"\n";
          rss += "  </item>"+"\n";
        }
        
        rss += " </channel>"+"\n";
        rss += "</rss>";
        
        return rss;
      }
    }
  } catch (e) {
    Logger.log(e.toString());
  }
}


/**
*/
function doGetTest() {
  function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
      if ((new Date().getTime() - start) > milliseconds){
        break;
      }
    }
  }
    
  var url = ScriptApp.getService().getUrl();
  var id = Utilities.base64Encode(url);
  var cache = CacheService.getPublicCache();
  cache.put(id, "", 0);
  sleep(1000);
  
  doGet();
}


