#!/usr/bin/ruby

require 'rubygems'
require 'classifier'
require 'madeleine'
require 'pg'

@table = ARGV[0]

$bayes_data = SnapshotMadeleine.new("#{@table}_data"){
	Classifier::Bayes.new 'Valid', 'Invalid'
}

def main
	db = PG::Connection.new(:host => "", :user => "", :password => "", :dbname => "")
	until false do	
		tweets = db.query("select * from #{@table} where parsed = 'f' limit 4000")
		if tweets.num_tuples() > 0
			tweets.each do |tweet|
				text = tweet["tweet_text"]
				if tweet["count"].to_i > 1
					$bayes_data.system.train_valid text
				   	db.query("update #{@table} set parsed = 't' where tweet_id = #{tweet["tweet_id"]}")
				elsif tweet["count"].to_i < -1
					$bayes_data.system.train_invalid text if tweet["count"].to_i < -1
					db.query("update #{@table} set parsed = 't' where tweet_id = #{tweet["tweet_id"]}")
				end
			end
		else
			sleep(15)
			next
		end
	end
end

Thread.new {
while true
	$bayes_data.take_snapshot
	sleep(1 * 60 * 60)
end
}

main
