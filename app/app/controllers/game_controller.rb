require 'twilio-ruby'

class GameController < ApplicationController
  include Webhookable

  after_filter :set_header

  def route
    game = Game.new(params)
    game.choice = params[:Digits].to_i unless params[:Digits].nil?
    game.request = request

    render_twiml game.play_room params[:url]
  end
end
