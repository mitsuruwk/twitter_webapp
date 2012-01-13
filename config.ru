$: << File.dirname(__FILE__)
require 'app'

use Rack::Deflater
run Sinatra::Application
