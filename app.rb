# -*- coding: utf-8 -*-
require 'rubygems'
require 'sinatra'
require 'sinatra/reloader'
require 'haml'
require 'sass'
require 'open-uri'
require 'dalli'
require 'digest/sha1'

class Cache
  def initialize
    @memcache = Dalli::Client.new('127.0.0.1:11211',
                                  :expires_in => 3600,
                                  :compression => true) 
  end
  
  def get(url)
    keys = _to_key(url)
    url == _get(keys[0]) ? [_get(keys[1]), _get(keys[2])] : nil
  end

  def store(url, content_type, json)
    keys = _to_key(url)
    _set(keys[0], url);
    _set(keys[1], content_type);
    _set(keys[2], json);
  end

  private
  def _get(key)
    @memcache.get(key)
  end
  
  def _set(key, val)
    @memcache.set(key, val)
  end
  
  def _to_key(key)
    hash = URI.encode(Digest::SHA256.digest(key))
    ["#{hash}_r", "#{hash}_c", "#{hash}_j"]
  end
end

set :cache, Cache.new

get '/twitter/' do
  haml :twitter, :escape_attrs => false
end

get '/twitter/screen.css' do
  scss :screen
end

get '/twitter/manifest.cache' do
  content_type 'text/cache-manifest'
  <<-EOS
CACHE MANIFEST

# date #{DateTime.now}
CACHE:
static/js/jquery-1.7.1.min.js
static/js/underscore-min.js
static/js/require-min.js
static/css/reset-min.css
screen.css
main.js
twitter_api.js

NETWORK:
*

FALLBACK:
    EOS
end

get '/twitter/proxy' do
  url = params.delete("url") + "?" +
    params.to_a.map{|x| "#{x[0]}=#{x[1]}"}.join("&")

  json, content_type = settings.cache.get(url)
  
  if json.nil? || content_type.nil? then
    f = open(url)

    json = f.read
    content_type = f.content_type

    settings.cache.store(url, json, content_type)
  end

  content_type content_type, 'charset' => 'utf-8'
  json
end

