# Tinsel

Tinsel is a game engine designed to help you create interactive experiences that can be experienced on any telephone, using a touch tone dial pad for input and audio text-to-speech for output.

Why the name Tinsel? It's vaguely like [Twine](http://twinery.org), but it involves (phone) trees. I know, you're groaning.

Try it out by calling [(646) 681-7902](tel:6466817902).

## So, what actually is it?

At its core, Tinsel is a couple of different things:

* A wrapper around the official Twilio API [rubygem](https://github.com/twilio/twilio-ruby) providing a simple foundation for common actions like traversing a phone tree based on entered input.
* A lightweight, database-free persistence layer to maintain user/player state within a given phone call
* A [Ruby on Rails](https://rubyonrails.org) harness application that takes care of serving Twilio-compatible REST endpoints and automatically routing requests for TwiML data.

Put together, Tinsel lets you easily script phone tree interactions using a simple Ruby interface. It was originally intended for Choose Your Own Adventure-style interactive fiction, but there's no reason you couldn't use it for any other phone system that communicates using touch tone phone input and text-to-speech output.

Here's an example of what it might look like in the very simple example of a fantasy adventure game:

```ruby
def encounter
  prompt do
    game.enemy = Goblin.new({hp: 5, attack: 2})

    say "You see a goblin in front of you. Press 1 to stab it with your sword, or 2 to hold out your shield."

    route 1 => :attack
    route 2 => :block
  end
end
  ...

def attack
  game.enemy.hp -= player.attack

  say "The goblin staggers as you deal it #{player.attack} damage"
  redirect :enemy_attack
end

def block
  say "You brace yourself before the goblin charge."
  redirect :enemy_attack
end

def enemy_attack
  ...
end

```

## Example

A more complex example can be found in the [`app/models/flappy.rb`](https://github.com/lazerwalker/tinsel/blob/master/app/models/flappy.rb) file. It's a functioning (if not particularly fun) turn-based Flappy Bird game. You can also check it out in action by calling [(646) 681-7902](tel:6466817902).


## Installation

Right now, the easiest way to get started with Tinsel is to clone this git repo. To start a new project, create a new file in the "models" folder that subclasses from the `Game` class. In `app/controllers/game_controller.rb`, replace the instantiation of a `Flappy` object on line 9 with an instantiation of your custom class.


## Documentation

### Nodes

Conceptually, a Tinsel game is divided up into a number of nodes. Each node is named, and defined simply by creating a Ruby method:

```ruby
def some_action
  # Logic goes here
end
```


### Actions

Each node can contain any number of sequential actions.


#### Redirect

The most basic action is `redirect`, which simply jumps to a different node by its name.

```ruby
def node_1
  redirect :node_2
end

def node_2
  # Loading node_1 will result in this logic being executed
end
```

As you can see, the name of a node is simply the name of its appropriate method, turned into a Ruby symbol by prepending a colon.


#### Say

The `say` command takes in a string, which is run through Twilio text to speech engine. By default, Twilio's "woman" voice will be used, but you can manually specify other voices.

```ruby
def titanic
  say "I love you, Jack" # Uses the "Woman" voice by default

  say "I love you, Rose", {voice: :Man}
  say_man "I love you, Rose" # Equivalent to the previous line

  say_alice "What about me?!" # Uses the "Alice" voice. Equivalent to adding {voice: Alice} to the end of a `say` command.
end
```

#### Pause

The `pause` command simply pauses for a moment.

```ruby
def borat
  say "This is so interesting."

  pause

  say "Not!"
end
```

#### Prompt

A `prompt` is a block of code that, after executing, waits for the player to enter some numbers and moves to a different node accordingly.

Within a `prompt` block, you can use the `say` or `pause` commands as normal. At the end, you'll want to specify what actions the player can take, using either the `choices` command or one or more `route` commands:

```ruby
def clone_via_routes
  prompt do
    say "You encounter a clone of yourself."
    say "Press 1 to fight it, or press 2 to attempt to have sex with it."

    route 1 => :fight
    route 2 => :have_sex
  end
end

def clone_via_choices
  prompt do
    say "You encounter a clone of yourself."
    say "Press 1 to fight it, or press 2 to attempt to have sex with it."

    choices {
      1 => :fight,
      2 => :have_sex
    }
  end
end
```

The system will not automatically tell the user what options there are, so be sure to explicitly spell out what choices there are using `say` commands.

If you want to fall back to some sort of default behavior if the user doesn't enter anything (typically a redirect), you can do so by putting that code after the prompt block.


### Persistence

Within your game logic, you have access to two variables, `self.player` and `self.game`. These are key-value stores that you can put any data in; they'll persist for the duration of a given player's current session. You can access them either with dot syntax or as dictionaries:

```ruby
  self.player.score = 10
  say "You have #{self.player.score} points"  # "You have 10 points"

  self.player["score"] += 5
  say "You now have #{self.player.score} points"  # "You now have 15 points"
```


### Raw Input

If you want to capture the raw input sent by a user, the latest value they have entered will be automatically stored in `self.player.choice`. Since this will be wiped out after the next prompt, if you want to save it for later it's recommended that you store it into a different key on `self.player` or `self.game`.


## Usage

Run `foreman start` from the command line within the project folder to spin up a Rails server. If you are running it locally, it will by default be at `localhost:5000`. If you have it set up with your custom code, you should be able to reach any endpoint by hitting `localhost:5000/some_path`, where `some_path` corresponds to the name of a method/node inside your Game subclass.

You should be able to go to a URL of that form inside your web browser, and see XML being loaded


## Twilio config

You'll want to create a new Twilio phone number on their [configuration page](https://www.twilio.com/user/account/phone-numbers/).

If you're testing locally, I recommend using [ngrok](https://ngrok.com). Once it's installed and you have a server running, simply run `ngrok 3000`. It will give you a URL of the format `<x>.ngrok.com`, where `<x>` will be a random combination of letters and numbers. On the Twilio configuration page, enter that URL, followed by the name of the method that serves as the entrypoint into your game.

You should now be able to call your Twilio phone number, and it should execute the code specified in the method you've specified.


## Deploying

As a pretty standard Rails app, an instance of Tinsel is ready to deploy on Heroku. If you create a new Heroku application and push your code, it should just work. You can check out the Procfile yourself; it's currently configured to use Unicorn as a web server with Heroku's basic recommended config.

If you've never used Heroku before, you may want to follow [their tutorial](https://devcenter.heroku.com/articles/getting-started-with-rails4) for deploying a Rails app.


## Caveats
Tinsel was originally built as part of a transmedia game project I was prototyping. I eventually stopped work on that project, but I felt that Tinsel was worth salvaging and releasing on its own. As such, it's fairly rough. This isn't production-ready code, both from a standpoint of scaling/stability and from the work required as a game designer to get things up and running.

I'd love to get it to the point where it can function more as a traditional game engine/framework rather than requiring such familiarity with Ruby and Rails, but it's difficult to justify putting in the time without the guarantee that anybody else will use it. If you find yourself using and enjoying Tinsel, drop me a line; knowing that people out there are interested in this and want to build cool shit with it would definitely inspire me to give it the love and polish it deserves.


## Contributing
Contributions are appreciated/accepted in any form! Please get in touch if you have questions or comments.


## License
Tinsel is available under the MIT License. See the LICENSE file for more information.


## Contact

Mike Lazer-Walker

- https://github.com/lazerwalker
- [@lazerwalker](http://twitter.com/lazerwalker)
- http://lazerwalker.com
