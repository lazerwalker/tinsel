# Tinsel

Tinsel is a game engine and hosted web service that enables the creation of telephony-based interactive audio experiences. If you want to make something that uses a touch tone dial pad for input and either text-to-speech or recorded audio for output, Tinsel might be the tool for you!

Why the name Tinsel? It's vaguely like [Twine](http://twinery.org), but it involves (phone) trees. I know, you're groaning.

It's heavily inspired by the lovely [Cheap Bots Done Quick](http://cheapbotsdonequick.com).


## What actually is it?

At a high level, Tinsel is a web app that lets you type or paste in scripts in a specific format, point a [Twilio](http://twilio.com) app at its servers, and magically have a functioning interactive phone tree you can call on any touch-tone phone.

In actuality, Tinsel is really two different things.

* A JSON-based grammar to declaratively describe content nodes and relationships between them based on numberpad input. If you've used Twine before, it's sort of like that, but without a visual editor.

* A web application that offers a browser-based UI for creating and editing Tinsel documents. It then dynamically transforms those scripts into Twilio-compatible TwiML files.

(Looking for the old, Ruby-based version of Tinsel? Check out the `ruby` branch: http://github.com/lazerwalker/tinsel/tree/ruby)

## So how do I use it?

http://maketinsel.com is the hosted version of Tinsel. That's probably what you want.


## A caveat on stability and security

Tinsel is very rough prototype software, with many bugs and missing features. Furthermore, it has been designed largely for games and interactive art, a choice that doesn't place particular importance on security or privacy. Which is to say: use Tinsel to make cool things. If you're trying to use it to fulfill a business need, you're likely better off building a custom solution yourself on top of Twilio.


# Language Reference

A Tinsel document is more or less a [JSON](http://json.org) document in a particular format. Here's a "Hello World" :

```json
{
    "start": "helloWorld",
    "story": {
        "helloWorld": {
            "content": "Hello, World!"
        }
    }
}
```

If you hooked that up to Twilio and called the appropriate phone number (see the "Connecting to Twilio" section), you'd hear a robotic voice say the words "Hello, world!" to you.


### Nodes

A Tinsel game is made up of one or more named nodes. The document's `story` key defines a dictionary. Inside this dictionary, each key is the name of a node and its value is the node itself. In this case, there's a single node, titled `helloWorld`, whose content is the text "Hello, World!". A node name can be any string that's a valid identifier name. While the quotation marks around the name are generally not necessary, they're recommended.


### Starting Node

The `start` key at the root of the document contains the name of the node that should be the first node players go to when they call the appropriate phone number.


### Content Arrays

Instead of a node containing a single piece of content, its `content` property can be an array containing one or more pieces of content. Here's a slightly modified version of our Hello World.

```json
{
    "start": "helloWorld",
    "story": {
        "helloWorld": {
            "content": ["Hello", "World"]
        }
    }
}
```


### Types of Content

In our Hello World example, the node's content is just a string containing some text for a robot to read. That's actually shorthand for the following:

```json
{
    "start": "helloWorld",
    "story": {
        "helloWorld": {
            "content": {
                "type": "text",
                "text": "Hello, World!"
            }
        }
    }
}
```

Notice that `type` option. You might be guessing right now that there are other types of content you can include that aren't "a robot says things". There are a whole bunch, each corresponding to a different [TwiML](https://www.twilio.com/docs/api/twiml/) verb. All of them also support any of the TwiML options right there as properties on the content object. How interesting!


#### Text

The `text` type corresponds to the TwiML [Say](https://www.twilio.com/docs/api/twiml/say) verb. It supports any options that the Say verb supports. For example, if we wanted that "Hello, World!" text to be said five times by a female robot voice, we could pass in the following:

```json
"content": {
    "type": "text",
    "text": "Hello, World!"
    "language": "en",
    "voice": "woman",
    "loop": 5
}
```

If you just pass in a string containing text, it will be assumed to be Text content with Twilio's default options (that is, it will be read a single time using the American English "man" voice).


#### Pause

The `pause` type corresponds to the TwiML [Pause](https://www.twilio.com/docs/api/twiml/pause) verb, and (surprise!) results in a brief pause.

The easiest way to use `pause` is with a string of the format `pause:x`, where `x` is the number of seconds to pause.

```
"content": [
    "This is so interesting!",
    "pause:2",
    "NOT!"
]
```

This is equivalent to:

```
"content": [
    {
        "type": "text",
        "text": "This is so interesting!"
    },
    {
        "type": "pause",
        "length": 2
    },
    {
        "type": "text",
        "text": "NOT!"
    }
]
```

#### Redirect

It's often useful to jump straight to another node. The `redirect` type lets you specify a node to move to.

The following will result in the text "One, Two, Three!" being spoken:

```json
{
    "start": "lilyPad1",
    "story": {
        "lilyPad1": {
            "content": ["One,", "redirect:lilyPad2"]
        },
        "lilyPad2": {
            "content": ["Two,", "redirect:lilyPad3"]
        },
        "lilyPad3": {
            "content": "Three!"
        },
    }
}
```

Any node can refer to any named node; you don't need to worry about what order they're defined in. A redirect happens instantly; if you include text or other content in a node after a redirect, it won't play. Similarly, if you include a redirect within a node that contains one or more routes (described below), the redirect will take precedence over user input.

As you can probably guess by now, a string of the format `redirect:nodeName` is equivalent to:

```json
{
    "type": "redirect",
    "text": "nodeName"
}
```

#### Playing Audio

The `play` type lets you play a prerecorded audio file. It corresponds to the TwiML [Play](https://www.twilio.com/docs/api/twiml/play) verb, and supports the same options it does.

Tinsel does not currently host audio files for you. You must upload them somewhere else on the web and link to them in your script. Tinsel supports mp3, wav, aiff, gsm, and μ-law files.

You can either use the play verb of the format `play:http://icq.com/uhoh.wav` or the full form:

```json
{
    "type": "play",
    "text": "http://instantrimshot.com/rimshot.wav",
    "loop": 10
}
```

### Routing

Of course, if you have a whole bunch of nodes, you need a way to get between them.

The simplest way to do this is by adding a `routes` dictionary to a node that maps from input digits to node names. Tinsel will not explicitly enumerate routes to the player, so be sure to include any instructions as spoken text-to-speech or audio.

```json
"fork": {
    "content": "You have reached a fork in the road. Press 1 to go left, or 2 to go right.",
    "routes": {
        "1": "left",
        "2": "right"
    }
},
"left": {
    "content": "You took the left path. How gauche!"
},
"right": {
    "content": "You took the right path, but not necessarily the path of the righteous."
}
```

If the "routes" dictionary exists as part of a node, Tinsel will listen for user input and take care of routing to the appropriate node.


#### "Any" Route

You can specify a catchall node if a player enters something that's not specified.

```json
"waiter": {
    "content": "What would you like for dinner? Press 2 for chicken, 4 for fish, or 6 for beef",
    "routes": {
        "2": "choseChicken",
        "4": "choseFish",
        "6": "choseBeef",
        "any": "choseUnknownFood"
    }
}
```

If the player enters anything other than 2, 4, or 6, they will be routed to the "choseUnknownFood" node.


#### "Default" Route

Tinsel won't wait forever for input. You can specify a `default` route that will be triggered after five seconds of no user input. (That timeout is configurable).

```json
"coinToss": {
    "content": "Call it in the air! One for heads, two for tails.",
    "routes": {
        "1": "heads",
        "2": "tails",
        "default": "tooSlow"
    }
},
"tooSlow": {
    "content": "Why didn't you choose one?" 
}
```

#### Options

By including an `options` dictionary within your routes, you can specify how listening for input is handled:

* How long the timeout is (5s by default),
* How many digits are expected
* If the player should press a specific key after finishing input (no by default). 

These all corresponds to the options for the TwiML [Gather](https://www.twilio.com/docs/api/twiml/gather) verb.

```json
"buyAPizza": {
    "content": "The price of a cheese pizza and a large soda at Panucci's Pizza is $10.77. To purchase, please enter your 4-digit pin, followed by the pound sign",
    "routes": {
        "any": "emptyBankAccount",
        "options": {
            "finishOnKey": "#",
            "numDigits": "4",
            "timeout": 10
        }
    }
}
```


### Interpolating JavaScript

This is all well and good, but what if you want to do something a bit more interactive?

Here's the _really cool_ bit about Tinsel: when defining a node's `content`, instead of passing in a static piece of content (a string, a content object, or an array of strings and/or objects), you can pass in an anonymous JavaScript function that returns valid content.

For example, the following will result in a voice saying "one plus one equals two".

```js
"content": function() {
    var result = 1 + 1;
    return "1 plus 1 equals " + result;
}
```

Pretty awesome, right?

All the standard rules apply about content blocks; that function could just as easily have returned `["1 plus 1 equals ", result]` or full content objects instead of strings.


#### Persisting state across nodes

Okay, so we can add some numbers together. Big whoop. Where this gets interesting is persisting state. 

Within these functions, you have access to a variable called `this`. Any data you set on the `this` object will persist across all other nodes.

```js
    "whoAreYou": {
        "content": function() {
            this.name = "Dave"; // or this["name"] = "Dave"
            return "redirect:disallow";
        }
    },
    "disallow": {
        "content": function() {
            return "I'm afraid I can't let you do that, " + this["name"]; // or this.name
        }
    }
```

Visiting "whoAreYou" will result in the spoken text "I'm afraid I can't let you do that, Dave". This state will be persisted across all nodes in the player's current phone call; if they hang up and call again, it will be a new game with fresh data.


#### Capturing entered input

If a node is visited as a result of the user entering in one or more digits, the entered number(s) can be accessed using the `this.Digits` property. This is particularly useful if a user was routed via an "any" or "default" node.

```js
"captureAny": {
    "content": "Press a number, any number.",
    "routes": {
        "any": "checkAnswer"
    }
},
"checkAnswer": {
    "content": function() {
        if (this.Digits == 1) {
            return "Good job! 1 was the secret number!"
        } else {
            return "You entered " + this.Digits + ", which is not the secret number.";
        }
    }
}
```

Note that the `this.Digits` property is erased/rewritten with every new node, so if you want to persist that data you should store it into a different property.


## Connecting to Twilio

Once you've written your Tinsel script, you probably want to play it! Tinsel uses [Twilio](https://twilio.com) for voice services.

**WARNING**: This costs real money. Twilio charges you to get a phone number through them ($1/month for a US number at the time of writing), as well as per minute of use ($0.01/minute for that same U.S. number to receive calls from a U.S. number). 

To say that more more time: **this will cost you real money.** We are not responsible for any charges you may incur.

1. Register for a Twilio account
2. Buy a phone number capable of receiving voice calls
3. On that number's configuration screen, make sure its Voice section is set to "Configure with URL"
4. Set the Voice request URL to be `http://maketinsel.com/YOUR_USERNAME/STORY_NAME`, with a verb of `GET`. `YOUR_USERNAME` will be the Twitter handle you use to log in to Tinsel.
5. Hit "Save"

That's it! If you call the number, it should start at the node specified by the `start` property of your Tinsel file.


# Self-Hosting Tinsel

It's also possible to host your own Tinsel instance. The suggested way to deploy Tinsel is to [Heroku](http://heroku.com) or an alternative PaaS with support for Heroku buildpacks.


### Using Heroku

1. Clone this repo: `git clone https://github.com/lazerwalker/tinsel.git`
2. Install the [Heroku Toolbelt](https://toolbelt.heroku.com/), if it isn't installed already
3. Create a new Heroku app from inside the project directory: `heroku create [name]`
4. Set up your Heroku instance with a free tier of Mongolab for MongoDB hosting
5. Register for a Twitter app: http://apps.twitter.com
6. Set the following config variables (feel free to use whatever alternate means you might like to set the ENV properly):

```
heroku config:set TWITTER_KEY="your consumer key here"
heroku config:set TWITTER_SECRET="your consumer secret here"
heroku config:set SESSION_SECRET="some string"
```

7. `git push heroku master`!


### Running locally

If you have the Heroku Toolbelt installed, you should be able to create a `.env` file with the appropriate keys, and `foreman start` should do it. You'll need Mongo running.


# Contributing
Contributions are appreciated/accepted in any form! Please get in touch if you have questions or comments.

There is a test suite you can run via `npm test`. It requires Mongo to be running, and will populate a test user in the database. It only tests consumer-facing features (e.g. serving TwiML files from a Tinsel script). 

As a warning: the code surrounding the editor UI is... not the most carefully crafted code I've ever written.


# License
Tinsel is available under the MIT License. See the LICENSE file for more information.


# Contact

Mike Lazer-Walker

- https://github.com/lazerwalker
- [@lazerwalker](http://twitter.com/lazerwalker)
- http://lazerwalker.com