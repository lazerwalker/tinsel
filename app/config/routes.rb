Robotsex::Application.routes.draw do
  get ':url' => 'game#route'
  post ':url' => 'game#route'
end
