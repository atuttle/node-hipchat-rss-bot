/*
		CREATE YOUR AUTH TOKEN AT: https://{YOUR-DOMAIN}.hipchat.com/admin/api
*/
var hipchatAuthToken = '';

/*
		Define some RSS feeds. All fields are required.
		- url: duh
		- frequencyInMinutes: number of minutes (or a fraction, if you want sub-minute polling*)
		- hipchat: {
			- roomId: integer room id in which you want new feed posts linked.
							Get a list of your rooms here: http://api.hipchat.com/v1/rooms/list?format=json&auth_token={YOUR-AUTH-TOKEN}
			- postColor: one of ['yellow', 'red', 'green', 'purple', 'gray', 'random']
			- postByName: Any string, shows up as the poster name. 1-15 characters.
			- notify: Whether or not this message should trigger a notification for people in the room (change the tab color, play a sound, etc).
							Each recipient's notification preferences are taken into account.
		}

		* I only recommend sub-minute polling when you own the RSS feed/server being polled. Hitting
				someone else's server that rapidly is kind of a jerk move.
*/
var feeds = [
	{
		url: 'http://feeds2.feedburner.com/FusionGrokker/'
		,frequencyInMinutes: 30
		,hipchat: {
			roomId: 146998
			,postColor: 'green'
			,postByName: 'FusionGrokker'
			,notify: 1
		}
	}
	,{
		url: 'http://www.countermarch.com/blog/rss.cfm?mode=full'
		,frequencyInMinutes: 30
		,hipchat: {
			roomId: 146998
			,postColor: 'green'
			,postByName: 'CounterMarch'
			,notify: 1
		}
	}
];

var rss = require('feedparser')
	,redis = require('redis')
	,url = require('url')
	,hipchatClient = require('node-hipchat')
	,redisclient, workers = [];

var delayMultiplier = 60 * 1000; //used to convert minutes into milliseconds


//connect to Redis -- default to local instance for dev
if (process.env.REDISTOGO_URL){
	var rtg   = url.parse(process.env.REDISTOGO_URL);
	redisclient = redis.createClient(rtg.port, rtg.hostname);
	redisclient.auth(rtg.auth.split(":")[1]);
}else{
	redisclient = redis.createClient();
}

//connect to hipchat!
var hipchat = new hipchatClient(hipchatAuthToken);

var onArticle = function(article, hipchatConfig) {
	doIfNotNagged( article.link, function(){
		console.log('NAGGING: %s', article.link.substr(0,35));
		hipchat.postMessage(
			{
				room: hipchatConfig.roomId
				,from: hipchatConfig.postByName
				,notify: hipchatConfig.notify
				,color: hipchatConfig.postColor
				,message: "<a href='" + article.link + "'>" + article.title + "</a>"
				,message_format: 'html'
			}
			,function(resp, err){
				console.log(resp, err);
				if (resp) {
					if (resp.status === 'sent'){
						markArticleNagged( article.link );
					}
				}
			}
		);
	});
};

var markArticleNagged = function(id) {
	redisclient.set( id, 'true' );
};

var doIfNotNagged = function(id, cb){
	redisclient.get( id, function(err, data){
		if (data === null) cb();
		return;
	});
};

//then schedule it every few minutes
for (ix in feeds){
	var feed = feeds[ix];
	setupPoller(feed.url, feed.frequencyInMinutes, feed.hipchat);
}

function setupPoller(url, freq, conf){

	var worker = eval(
		"(function(){ console.log('polling: "
		+ url
		+ "'); rss.parseUrl('"
		+ url
		+ "').on('article', function(a){ onArticle(a, "
		+ JSON.stringify(conf)
		+ "); })});");

	setInterval(
		worker
		,freq * delayMultiplier
	);

	worker();
}

console.log('--- INITIALIZATION COMPLETE ---');
