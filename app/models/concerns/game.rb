VOICE = "woman"

module Game
  extend ActiveSupport::Concern

  attr_accessor :options, :choice, :request, :player, :game

  def initialize(params)
    self.player = PersistenceObject.new(params)
    self.game = PersistenceObject.new(params)
  end

  def choices(options)
      self.options = options
  end

  def pause
    @actions.push Action.new :Pause
  end

  def prompt (opts={})
    oldActions = @actions
    @actions = []

    yield if block_given?
    @gatherActions = @actions
    @actions = oldActions

    action = Action.new :Gather, [{method: "GET", numDigits: 1}.merge(opts)]
    action.proc = Proc.new do |s|
      @gatherActions.each do |action|
        s.__send__ action.verb, *action.params
      end
    end
    @actions.push action
  end

  def route (hash={})
    @options ||= {}
    @options.merge! hash
  end

  def say (string, opts={})
    opts[:voice] ||= VOICE
    @actions.push Action.new :Say, [string, opts]
  end

  def say_alice(string, opts={})
    opts[:voice] = :Alice
    say string, opts
  end

  def say_man(string, opts={})
    opts[:voice] = :Man
    say string, opts
  end

  def say_woman(string, opts={})
    opts[:voice] = :Woman
    say string, opts
  end

  def redirect (route)
    url = path_to route
    unless url.nil?
      @actions.push Action.new :Redirect, [url, method: "GET"]
    end
  end

  def play_room (room)
    @actions ||= []
    self.send room

    unless choice.nil? || @options.nil?
      for key, value in @options
        if choice == key
          if value.is_a? Array and value.length == 2
            path = value[0]
            self.player.choice = value[1]
            url = path_to path
          else
            url = path_to value
          end

          return Twilio::TwiML::Response.new do |r|
            r.Redirect url, method: "GET"
          end
        end
      end

      if @options.has_key? :any
        self.player.choice = choice
        url = path_to @options[:any]
        return Twilio::TwiML::Response.new do |r|
          r.Redirect url, method: "GET"
        end
      end
    end

    return Twilio::TwiML::Response.new do |r|
      @actions.each do |action|
        if action.proc.nil?
          r.__send__ action.verb, *action.params
        else
          r.__send__ action.verb, *action.params, &action.proc
        end
      end
    end

  end

  private

  def path_to (route)
    "#{request.scheme}://#{request.host_with_port}/#{route.to_s}?#{self.player.to_query}"
  end
end
