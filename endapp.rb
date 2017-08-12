require 'sinatra'

class ENDApp < Sinatra::Base

  set :public_dir, File.expand_path('../public', __FILE__)

  get '/' do
    send_file 'index.html'
  end
end
