require 'rubygems'
require 'classifier'
require 'madeleine'
require 'sinatra'
require 'pg'
require 'logger'

class WNVClassify < Sinatra::Base
	Tables = ["wnv", "flu", "rabies", "polio", "mumps", "diptheria", "anthrax", "malaria", "legionella", "std",
              "cold", "dengue", "cholera", "tick", "meningitis", "varicella", "pertussis", "tuberculosis",
              "pneumonia", "measles", "gastro", "yellow_fever", "typhoid", "tetanus", "smallpox"]		

	@@log = Logger.new("log/classify.log", shift_age = 'weekly')

	before do
		content_type "application/json"
	end
	
	get '/' do
		return " " if params["table"].nil? || params["table"].empty? || params["id"].nil?
		table = params["table"].to_i
		id = params["id"]
		@@log.add(Logger::DEBUG, "ID: #{id}", "WNVClassify")
		@bayes_data = SnapshotMadeleine.new("#{Tables[table]}_data") {
			Classifier::Bayes.new 'Valid', 'Not_Valid'
		}
		db = PG::Connection.new(:host => "", :user => "", :password => "", :dbname => "")
		begin
			tweet = db.query("select tweet_text from #{Tables[table]} where tweet_id = #{id}")[0]
			@@log.add(Logger::DEBUG, "Table: #{Tables[table]}", "WNVClassify")
		rescue Exception => e
			@@log.add(Logger::ERROR, e, "WNVClassify")
		end
		@bayes_data.system.classify(tweet["tweet_text"])
	end
end
