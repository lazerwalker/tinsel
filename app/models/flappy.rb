class Flappy
  include Game

  def flappy
    say "Welcome to flappy bot. To play, press 1 to flap. You can quit at any time by pressing 0."
    redirect :flappy_start
  end

  def flappy_start
    self.player.flappy_score = 0
    self.player.choice = nil
    self.player.flappy_first = true
    self.player.height = 2
    redirect :flappy_recurse
  end

  def flappy_recurse
    self.player.height = self.player.height.to_i

    if self.player.height > 0
      self.player.height -= 1
    end

    if self.player.height > 2
      self.player.height = 2
    end

    if self.player.flappy_first == "true"
      self.player.flappy_first = false
    else
      if (self.player.height != self.player.pipe_height.to_i)
       redirect :flappy_lost
       return
      end

      self.player.flappy_score = self.player.flappy_score.to_i + 1
      say "#{self.player.flappy_score} #{"point".pluralize(self.player.flappy_score)}."
    end

    self.player.pipe_height = Random.rand(3)

    prompt timeout: 1 do
      say "You are flying at a #{flappy_height self.player.height} height. A pipe is approaching with a #{flappy_height self.player.pipe_height} height."
      route 1 => :flap
    end

    redirect :flappy_recurse
  end

  def flap
    self.player.height = self.player.height.to_i + 2
    redirect :flappy_recurse
  end

  def flappy_lost
    prompt do
      say "You have lost. Your final score is #{self.player.flappy_score} #{"points".pluralize(self.player.flappy_score.to_i)}. Press 1 to play again."
      route 1 => :flappy_start
    end
  end

  private

  def flappy_height(height)
    case height
    when 0
      "low"
    when 1
      "medium"
    when 2
      "high"
    end
  end
end
