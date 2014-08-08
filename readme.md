# Node HipChat RSS Bot

I use this, among other things, to push application exception notifications into my team's HipChat room.

It's designed to monitor multiple RSS feeds of your choosing, and when a new item is found, push a link into a HipChat room.

> ## It can run perpetually, _for free_, on Heroku!

> ![Running for free on Heroku!](http://fusiongrokker.com/assets/content/2014/08/heroku_perpetual_free.png)

Everything is configurable. Each feed can have a unique:

* polling frequency
* hipchat room (currently limited to one per feed)
* notification color
* poster-name
* notification flag

# Setup

## Running on Heroku

* **This bot can run for free on a single Heroku 'worker' dyno.**
* Requires a Redis instance to run. Not to worry, there are free tiers to some of the Heroku redis providers. Currently I recommend _Redis To Go_. No Redis configuration is necessary. If you choose a provider other than _Redis To Go_ then you'll need to edit the code where the Redis client connects to your Redis instance.

```bash
gem install heroku
gem install foreman
git clone https://github.com/atuttle/node-hipchat-rss-bot.git hipchat-bot; cd hipchat-bot
npm install
heroku create --addons redistogo:nano
```

Then make the changes detailed in the **HipChat** and **Feeds** sections below.

To run it locally you need to have redis installed and running (the default configuration should be fine) and of course Node 0.8.x+. Then start the bot with:

```bash
foreman start
```

Hit Ctrl+C to stop the bot. Change and repeat as necessary.

Once you're satisfied, publish to Heroku:

```bash
git push heroku master;heroku logs -t
```

Watch the logs as your app starts up. Errors will be reported here. If everything is fine, you can hit Ctrl+C to close the log viewer and the bot will continue running.

For more information on controlling your Heroku app from the command line, see [here](https://devcenter.heroku.com/categories/command-line).

### HipChat

This bot uses the REST API to interact with your hipchat rooms, and as such does not require its own (paid) user account, like XMPP/Jabber bots.

You'll need an auth token, which you can obtain here: https://www.hipchat.com/admin/api

Edit main.js and put your auth token in the variable value:

```js
var hipchatAuthToken = '';
```

### Feeds

Just below the HipChat config you'll find a section where you can define your feeds. A couple are included as a syntax example. Feel free to remove and replace them with the feeds in which you're interested.

- **url:** duh!
- **frequencyInMinutes:** number of minutes (or a fraction, if you want sub-minute polling*)
- **hipchat:**
  - **roomId:** Integer room id in which you want new feed posts linked. Get a list of your rooms here: `http://api.hipchat.com/v1/rooms/list?format=json&auth_token={YOUR-AUTH-TOKEN}`
  - **postColor:** one of `yellow, red, green, purple, gray, random`
  - **postByName:** Any string, shows up as the poster name. 1-15 characters.
  - **notify:** Whether or not this message should trigger a notification for people in the room (change the tab color, play a sound, etc). Each recipient's notification preferences are taken into account by HipChat.

\* Please don't use sub-minute polling unless you own the RSS feed/server being polled. Hitting someone else's server that rapidly is kind of a jerk move!
