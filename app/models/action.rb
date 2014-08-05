class Action
  attr_accessor :verb, :params, :proc

  def initialize(verb, params={})
    self.verb = verb
    self.params = params
  end
end
