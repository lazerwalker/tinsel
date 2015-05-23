class Game
  include GameConcern 
  Dir["#{Rails.root}/../game/**/*.rb"].each{|file| require file }
end
