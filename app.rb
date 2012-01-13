# -*- coding: utf-8 -*-
require 'rubygems'
require 'sinatra'
require 'sinatra/reloader'
require 'haml'
require 'sass'
require 'open-uri'
require 'dalli'
require 'digest/sha1'

set :memcache, Dalli::Client.new('127.0.0.1:11211',
                                 :expires_in => 3600,
                                 :compression => true) 

get '/twitter/' do
  haml :twitter, :escape_attrs => false
end

get '/twitter/screen.css' do
  scss :screen
end

get '/twitter/proxy' do
  url = params.delete("url") + "?" + params.to_a.map{|x| "#{x[0]}=#{x[1]}"}.join("&")

  hash = URI.encode(Digest::SHA256.digest(url))
  key_for_url = "#{hash}_url"
  key_for_json = "#{hash}_json"

  cache_url = settings.memcache.get(key_for_url)
  json = settings.memcache.get(key_for_json)

  unless cache_url == url && json then
    json = open(url).read
    settings.memcache.set(key_for_url, url)
    settings.memcache.set(key_for_json, json)
  end

  json
end

