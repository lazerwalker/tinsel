# Tinsel

Tinsel is a game engine and hosted web service that enables the creation of telephony-based interactive audio experiences. If you want to make something that uses a touch tone dial pad for input and either text-to-speech or recorded audio for output, Tinsel might be the tool for you!

Although it wasn't built using Tinsel, [Here And There Along The Echo](http://kentuckyroutezero.com/here-and-there-along-the-echo/) is a great example of the sort of experience you could use Tinsel to build. A few other sample projects also exist:

* Call [(858) 215-1980](tel:+18582151980) for a Flappy Bird clone ([source](https://github.com/lazerwalker/tinsel/blob/master/flappy.json))

Why the name Tinsel? It's vaguely like [Twine](http://twinery.org), but it involves (phone) trees. I know, you're groaning. Tinsel is also heavily inspired by the lovely [Cheap Bots Done Quick](http://cheapbotsdonequick.com).

## What actually is it?

At a high level, Tinsel is a web app that lets you create scripts in a specific format, point a [Twilio](http://twilio.com) app at its servers, and magically have a functioning interactive phone tree you can call on any touch-tone phone.

In actuality, Tinsel is really three different things.

* A JSON-based grammar to declaratively describe content nodes and relationships between them based on numberpad input. 

* A web application that offers a browser-based UI for creating and editing Tinsel documents. It then dynamically transforms those scripts into Twilio-compatible TwiML files.

* An integration that allows you to use the [Twine 2](http://twinery.org) editor to create stories, automatically converting from Twine's format into Tinsel scripts and exporting those scripts to the hosted Tinsel service.

The Twine integration specifically lives in the [Tinsel-Twison](https://github.com/lazerwalker/tinsel-twison) GitHub repo.

(Looking for the old, Ruby-based version of Tinsel? Check out the `ruby` branch: http://github.com/lazerwalker/tinsel/tree/ruby)


## So how do I use it?

http://www.maketinsel.com is the hosted version of Tinsel. That's probably what you want.


## A caveat on stability and security

Tinsel is very rough prototype software, with many bugs and missing features. Furthermore, it has been designed largely for games and interactive art, a choice that doesn't place particular importance on security or privacy. Which is to say: use Tinsel to make cool things. If you're trying to use it to fulfill a business need, you're likely better off building a custom solution yourself on top of Twilio.


# Using Twine to make Tinsel scripts

The easiest way to use Tinsel is to write your stories using [Twine 2](http://twinery.org). This section will talk about how to get that set up, as well as how to actually write and export your stories from Twine to Tinsel.


## Setup

Make sure you are using Twine 2. Either the web-based or downloadable versions will work, but you need to be using Twine 2; Twine 1 is not currently supported.

From the Twine 2 story select screen, add a story format (click the "Formats" button on the right, then "Add a story format". Enter the url `http://lazerwalker.com/tinsel-twison/format.js`.

From within your story, set its story format to Tinsel. You can do this by clicking the bottom toolbar item with the name of your story, and then selecting "Change Story Format".

From here on out, choosing "Play" from within the story editor will give you a Tinsel-compatible JSON file you can copy and paste straight into the Tinsel web editor at http://maketinsel.com. 

Once you've done that, you'll be able to play your story on an actual telephone by following the instructions in the "Conneting to Twilio" section below.


## Writing With Twine

This guide assumes familiarity with Twine 2. If you've never used it, you might want to check out the resources for beginners on the [Twine 2 wiki](http://twinery.org/wiki/twine2:guide).

Writing Tinsel stories in Twine is generally the same as regular Twine use, but there are a bunch of specifics to note.

For the most part, your Tinsel stories will communicate with the player in one of two ways: text to speech, or prerecorded audio. In a given Twine node, you can do either or both of these, as well as insert a silent pause, automatically redirect to another node, and link to other nodes based on the result of the player's numeric input.

### Hello, World!

If you just have plain text inside a Twine node, Tinsel will read that out as text-to-speech using the default Twilio voice (a male voice with an American accent).

The simplest possible functioning Tinsel story would be a single node with the following text:

```Hello, world!```

### Alternate Text-To-Speech Options

Twilio (and subsequently Tinsel) offer three different voices: a male voice (called "man"), and two female voices ("woman" and "alice"). As mentioned above, the default voice is "man", but you can explicitly specify any of these voices by prefixing your text with the name of the voice and a colon.

```woman: This will be said in a female voice```


### Mixing and matching multiple voices

You can have multiple voices within a single node by putting two newlines between text. 

```
man: I'm late! I'm late!

woman: Off with their heads!

alice: I really shouldn't have fallen down that rabbithole!
```

A node with these contents will read those three sentences, in the appropriate voices, in the order they are listed.


### Pausing

You can insert an explicit pause by using the string `pause:x` (or `pause: x`, spaces are okay), where `x` is the number of seconds to pause. Like including multiple voices, you should separate a pause by two newlines on either side from other content.

```
man: I see you shiver with anticip-
 
pause: 1

man: ation.
```

### Playing audio files

If you want to play a prerecorded audio file, it's as simple as putting in a string of the format `play: http://icq.com/uhoh.wav`.

Tinsel does not currently host audio files for you; you must upload them somewhere else on the web and link to them in your script. Tinsel supports mp3, wav, aiff, gsm, and μ-law files.

As with everything else, separate this by two newlines.

```
alice: Why was Cinderella so bad at soccer?

pause: 2

alice: Because she kept running away from the ball!

play: http://instantrimshot.com/rimshot.wav
```


### Redirecting

Sometimes you might want to redirect directly to another node. You can do that with the text `redirect: nodename`, where `nodename` is the name of the Twine node to redirect to.

As soon as that redirect command is reached, the contents of the next node will be played. If you include text or other content in a node after a redirect, it won't play. Similarly, if you include a redirect within a node that contains one or more routes (described below), the redirect will take precedence over user input.

**lilypad1**

```
One!

redirect:lilypad2
```

**lilypad2**

```
Two!

redirect:lilypad3
```

**lilypad3**

```
Three!
```

Loading the "lilypad1" node will result in the text "One! Two! Three!" being spoken.


### Links

Of course, if you have a whole bunch of nodes, you need a way for the player to navigate between them other than automatic redirects.

Twine operates on hyperlinks: you click on a word anywhere inside a node, and it links you to somewhere else. Tinsel is closer to a "choose your own adventure" novel: while in a given node, the player can punch in certain numbers on their phone to link to another node. As a result, you need to think about linking a little bit differently in Tinsel than in normal Twine.

Here is an example of what your links should look like.

```
You have reached a fork in the road. Press 1 to go left, or 2 to go right.

[[1->left]]
[[2->right]]
```

This will use text-to-speach to read the first sentence to the player, and then listen for input. If the player presses 1, the node entitled "left" will play; if they press 2, the "right" node will play.

Note that Tinsel does not tell the player about the existence of links. It's up to you as the author to inform your player, through text-to-speech or recorded audio, what their options are. That previous example does that by explicitly telling the player that they can press 1 or 2, and what choice each of those numbers represents.

You can technically put Tinsel links anywhere in the node – they will be properly parsed as links, and not spoken by the text-to-speech engine – but it's recommended that you follow the convention of putting them at the end of the node.

#### "Any" links

You can also use the "any" label to create a link that will be followed if the player enters a number that doesn't have an explicit link connected to it:

```
What would you like for dinner? Press 2 for chicken, 4 for fish, or 6 for beef.

[[2->choseChicken]]
[[4->choseFish]]
[[6->choseBeef]]
[[any->choseUnknownFood]]
```

If the player enters anything other than 2, 4, or 6, they will be routed to the "choseUnknownFood" node.


#### "Timeout" links

Similarly, you can use the "timeout" label to specify a link that should be followed if the player doesn't enter anything after five seconds have passed.

```
Call it in the air! One for heads, two for tails.

[[1->heads]]
[[2->tails]]
[[timeout->tooSlow]]
```

#### Configuring links 

What if you want to use a `timeout` link, but want the wait period to be shorter or longer than 5 seconds?

It's possible to configure a few options related to links:

* How long the timeout is (5s by default),
* How many digits are expected (default 1)
* If the player should press a specific key after finishing input (no by default).

If you've used Twilio before, these all corresponds to the options for the TwiML Gather verb (which Tinsel uses under the hood).

```
The price of a cheese pizza and a large soda at Panucci's Pizza is $10.77. To purchase, please enter your 4-digit pin, followed by the pound sign

[[any->emptyBankAccount]]

{{routeOptions}}
	{{timeout}}10{{/timeout}}
	{{numDigits}}4{{/numDigits}}
	{{finishOnKey}}#{{/finishOnKey}}
{{/routeOptions}}
```

This options block can be placed anywhere within your node, so long as there are at least two newlines between it anything else.

### Embedding JavaScript
This is all well and good, but what if you want to do something a bit more interactive?

Here's the really cool bit about Tinsel: instead of just specifying static content in the format we've just outlined, you can instead embed a JavaScript fuction that in turn returns valid content.


For example, the following will result in a voice saying "one plus one equals two".

```
{{js}}
    var result = 1 + 1;
    return "1 plus 1 equals " + result;
{{/js}}
```

Pretty awesome, right? Just like everything else in Tinsel, you can mix JS code with other bits of content by separating them with two newlines.

```
woman: What's 1 + 1?

{{js}}
	var result = 1 + 1;
	return "alice: " + result + "!"
{{/js}}
```

This will result in the `woman` voice asking "what's 1 + 1?" and the `alice` voice responding "2!".
	
(For the security-minded: this JS is all executed within a jailed sandbox context.)

### Persisting state across nodes

Okay, so we can add some numbers together. Big whoop. Where this gets interesting is persisting state.

Within these functions, you have access to a variable called `this`. Any data you set on the this object will persist across all other nodes.

**whoAreYou**

```
{{js}}
	this.name = "Dave"; // or this["name"] = "Dave"
{{/js}}

redirect:disallow
```

**disallow**

```
{{js}}
    return "I'm afraid I can't let you do that, " + this["name"]; // or this.name
{{/js}}
```

Visiting "whoAreYou" will result in the spoken text "I'm afraid I can't let you do that, Dave". This state will be persisted across all nodes in the player's current phone call; if they hang up and call again, it will be a new game with fresh data.

### Macros
You cannot use any Twine macros when writing Tinsel. This is why Tinsel instead offers the ability to interpolate JS code with the `{{js}}` tag instead.


# Connecting to Twilio

Once you've written your Tinsel script, you probably want to play it! Tinsel uses [Twilio](https://twilio.com) for voice services.

**WARNING**: This costs real money. Twilio charges you to get a phone number through them ($1/month for a US number at the time of writing), as well as per minute of use ($0.01/minute for that same U.S. number to receive calls from a U.S. number). 

To say that once more: **this will cost you real money.** We are not responsible for any charges you may incur.

1. Register for a Twilio account
2. Buy a phone number capable of receiving voice calls
3. On that number's configuration screen, make sure its Voice section is set to "Configure with URL"
4. Set the Voice request URL to be `http://www.maketinsel.com/YOUR_USERNAME/STORY_NAME`, with a verb of `GET`. `YOUR_USERNAME` will be the Twitter handle you use to log in to Tinsel.
5. Hit "Save"

That's it! If you call the number, it should start at the node specified by the `start` property of your Tinsel file. After it's set up, any new changes you make to your story script should be reflected instantly on Twilio as soon as you save them in the web editor.



# Full Language Reference

This section documents the JSON-based format Tinsel uses under the hood.

For most users, the Twine integration is the best way to use Tinsel. However, this will be useful if you'd prefer to write your Tinsel scripts by hand using Tinsel's web-based script editor.

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
    "text": "Hello, World!",
    "language": "en",
    "voice": "woman",
    "loop": 5
}
```

If you just pass in a string containing text, it will be assumed to be Text content with Twilio's default options (that is, it will be read a single time using the American English "man" voice).

You can also prefix a string with the name of the voice to use for the three `en-us` voices:

```json
"content": [
    "man: I'm late! I'm late!",
    "woman: Off with their heads!",
    "alice: I really shouldn't have fallen down that rabbithole!"
]
```


#### Pause

The `pause` type corresponds to the TwiML [Pause](https://www.twilio.com/docs/api/twiml/pause) verb, and (surprise!) results in a brief pause.

The easiest way to use `pause` is with a string of the format `pause:x`, where `x` is the number of seconds to pause.

```
"content": [
    "I see you shiver with anticip-",
    "pause:1",
    "ation."
]
```

This is equivalent to:

```
"content": [
    {
        "type": "text",
        "text": "I see you shiver with anticip-"
    },
    {
        "type": "pause",
        "length": 1
    },
    {
        "type": "text",
        "text": "ation."
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

If the `routes` dictionary exists as part of a node, Tinsel will listen for user input and take care of routing to the appropriate node.


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


#### "Timeout" Route

Tinsel won't wait forever for input. You can specify an `timeout` route that will be triggered after five seconds of no user input. (That timeout is configurable).

```json
"coinToss": {
    "content": "Call it in the air! One for heads, two for tails.",
    "routes": {
        "1": "heads",
        "2": "tails",
        "timeout": "tooSlow"
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

(For the security-minded: this JS is all executed within a jailed sandbox context.)


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

JS functions can also be used as individual elements within an array:

```js
    "node": {
        "content": [
            "I am a string",
            function() { return "I am a function"; }
        ]
    }
```

However, arrays do not get flattened; in other words, a function within a content array must not itself return an array.

Finally, you can also specify a function as a string prefixed with `js:`. This is largely intended to be used for interoperation with [Twison](https://github.com/lazerwalker/twison) and other code generators, not to be used by actual individuals. Note that these strings must be a single line; "var foo = 1;\n var bar = 2;" will work, but having an actual newline in the file will not.

```js
    "node": {
        "content": "js:function() { \n return \"O hai!\"; \n }""
    }
```

#### Capturing entered input

If a node is visited as a result of the user entering in one or more digits, the entered number(s) can be accessed using the `this.Digits` property. This is particularly useful if a user was routed via an "any" node.

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
