require 'rubygems'
require 'sinatra'
require 'mysql'
require 'json'
require 'net/http'
require 'madeleine'
require 'mylib'

class TwitterFeedback < Sinatra::Base
	@@table = "wnv"
	m = SnapshotMadeleine.new("tmpwnv"){
		MyLib::StorageObject.new
	}
	@@pick = m.system.value
	before do
		content_type "application/json"
	end

	get '' do
		db = Mysql.new("", "", "", "")
		min = db.query("select min(tweet_id) as min from #{@@table}").fetch_row()[0]
		max = db.query("select max(tweet_id) as max from #{@@table}").fetch_row()[0]
		@@pick = db.query("select tweet_id from #{@@table} where tweet_id > #{@@pick} limit 1").fetch_row()[0]
		m.system.value = @@pick
		m.take_snapshot
		tweet = db.query("select * from wnv where tweet_id = #{@@pick}").fetch_row()
		if tweet.nil?
			{ :id => 0, :text => "End of database"}.to_json
		else
			{ :id => tweet[0], :text => tweet[1]}.to_json
		end
	end
	
	post '' do
		#return "params id = #{params["id"]}, type is #{params["id"].class}"
		if params["id"].nil?
			return "someone set up us the bomb"
		end
		db = Mysql.new("", "", "", "")
		id = params["id"]
		id = id.to_i
		return if id == 0
		tmp = db.query("select * from #{@@table}feedback where tweet_id = #{id}")
		#return "tmp db query = #{tmp.num_rows()}"
		if params["valid"] =~ /true/
			if tmp.num_rows() < 1
				db.query("insert into #{@@table}feedback values (#{id}, 1, 0)")
			else	
				row = tmp.fetch_row()
				count = row[1].to_i
				count += 1
				db.query("update #{@@table}feedback set valid=#{count} where tweet_id = #{id}")
			end
		elsif params["valid"] =~ /false/
			if tmp.num_rows() < 1
				db.query("insert into wnvfeedback values (#{id}, 0, 1)")
			else
				count = tmp.fetch_row()
				count = count[2].to_i
				count += 1
				db.query("update #{@@table}feedback set invalid=#{count} where tweet_id = #{id}")
			end
		end
	end
end

