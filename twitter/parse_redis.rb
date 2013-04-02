#!/usr/bin/ruby
require 'rubygems'
require 'geocoder/us'
require 'hiredis'
require 'redis'
require 'json'
require 'logger'
require 'mysql'
require 'pg'

@db = Geocoder::US::Database.new('geodata/geocoder.db')
@redis = Redis.new(:host => "localhost")
@sql = PG::Connection.new(:host => "",:user => "", :password => "", :dbname => "")
@mysql = Mysql.connect("", "", "", "")
@log = Logger.new("twitter/script/geocodeJSON.log", shift_age = 'weekly')
@log2 = Logger.new("twitter/script/geocodeERROR.log", shift_age = 'weekly')
@log3 = Logger.new("twitter/script/geocodeEmpty.log", shift_age = 'weekly')
@log4 = Logger.new("twitter/geocoded.log", shift_age = 'weekly')
@debug = true

def get_loc(location)
  begin
    @log3.add(Logger::INFO, "Tweet Location Empty", "parse_redis")
    puts "!!! Location Empty"
    return 0
  end if location.empty? || location.nil? || location == ""
  begin
    loc = @db.geocode location
  rescue Exception => e
    @log.add(Logger::WARN, e)
    @log2.add(Logger::INFO, "Tweet Geocode Failed", "parse_redis")
    puts "!!! Geocode failed"
    return 0
  end
  unless loc.empty? || loc[0][:lat].nil? || loc[0][:precision] == :street
    @log4.add(Logger::INFO, "Tweet Geocoded #{location}: #{loc}", "parse_redis")
    puts "!!! Geocode SUCCESSFUL"
    return loc[0]
  else
    @log2.add(Logger::INFO, "Tweet Geocode Failed", "parse_redis")
    puts "!!! Geocode failed"
    return 0
  end
end

@terms = {
  "wnv" => ' "#westnilevirus" "mosquito borne disease" "West Nile Virus" "#WNV" "mosquito virus" "west nile encephalitis" "west nile fever" "west nile" "equine encephalitis" "#EEE" "la crosse encephalitis" "japanese encephalitis" "st. louis encephalitis" "#WEE" "#westnile" ',
  "flu" => ' "influenza" "Flu" "adenovirus" "h1n1" "h3n2"  "h5n1" "ah1n1" "#influenza" "#flu" "#h1n1" "#h3n2" "#h5n1" "#ah1n1" ',
  "rabies" => ' "Rabies" "lyssa" "#rabies" "#lyssa" ',
  "polio" => ' "#Polio" "poliomyelitis" "infantile paralysis" "#poliovirus" "#polio" "#poliomyelitis" "#poliovirus" ',
  "mumps" => ' "Mumps" "acute viral parotitis" "epidemic partotitis" "#mumps" ',
  "diptheria" => '  "Diphtheria" "#diptheria" ',
  "anthrax" => '  "anthrax" "#anthrax" ',
  "malaria" => ' "Malaria" "#malaria" "Plasmodium" "#plasmodium" "blackwater fever" "#blackwaterfever" "falciparum" "#falciparum" "biduoterian fever", ',
  "legionella" => ' "Legionella"  "#Legionella" "Pontiac Fever" "Legionnaires Disease" "legionellosis" ',
  "std" => ' "Sexually Transmitted Disease" "STD" "#STD" "#chlamydia" "#psitacci" "the clap" "trachomatis" "#gonorrhea" "#herpes" "#HIV" "#AIDS" "Human Papillomavirus" "#HPV" "Pelvic Inflammatory Disease" "#PID" "#Syphilis"  "Trichomoniasis" "Bacterial Vaginosis" "#BV"  "Public Lice" "Public Crabs" "#herp" "#trich" "Hepatitis" "#Hepatitis" "drip" "personal problem" "nature problem"  "urinary infection" "kidney infection" "discharge" ',
  "cold" => ' "Common Cold" "Cold" "#cold" "colds" "#colds" "respiratory tract infection" "rhinovirus" "nasopharyngitis" "rhinopharyngitis" "runny nose" "pharyngitis" "sinusitis" "nasal congestion" "URI" "#URI" "upper respiratory infection" "HRV" "#HRV" "coronavirus" "URTI" ',
  "dengue" => ' "Dengue"  "#Dengue" "dengue fever" "dengue haemorrhagic fever" "dengue hemorrhagic fever" "dengue virus" ',
  "cholera" => ' "Cholera" "#Cholera" "vibrio cholera" "choleragen" "choleras" ',
  "tick" => ' "tick borne disease" "tick virus" "tick fever"  "tick paralysis" "babesiosis" "ehrlichiosis" "lyme disease" "Rocky Mountain Spotted Fever" "RMSF"  "Anaplasmosis" "rickettsiosis" "STARI" "Southern Tick-Associated Rash Illness" "TBRF" "Tickborne Relapsing Fever" "tularemia" "relapsing fever" ',
  "meningitis" => ' "Meningitis" "meningiti" "meningitide"  "meningitides" "brain infection" "neisseria meningitidis" "meningities" "encephalitis" "Hib" "lymphocytic choriomeningitis" "LCMV" "choriomeningitis" "LCM" "meningococcal" "mollarets" "meningitys" "meningococcus" "meningoencephalitis" "encephalities" ',
  "varicella" => ' "Varicella" "chicken pox" "chickenpox" "#chickenpox" "herpes zoster" "herpes virus 3" "herpesvirus 3" "varicella zoster" "varicellovirus" "herpes varicella" "#shingles" "zoster" "VZV" ',
  "pertussis" => ' "#Pertussis" "Pertussis" "pertuss" "whooping cough" "pertusses" "bordetella" "whoop" "whooping" "whoops" "bordetellosis" "croup" "paroxysmal cough" "paroxysmal coughing" ',
  "tuberculosis" => ' "Tuberculosis" "TB" "#TB" "tuberculose" "tuberculoses" "tuberculosi" "MDR TB" "XDR TB" "TDR TB"  "BCG vaccine" "BCG vaccination" "Potts disease" "tuberculosys" "tuberculous" "consumption" "Kochs disease" "phthisis" "Mantoux test" ',
  "pneumonia" => ' "Pneumonia" "#Pneumonia" "pneum" "pneumococcal" "bronchopneumonia" "pneumocystis" "lung infection" "chest infection" "walking pneumonia" ',
  "measles" => ' "Measles" "measle" "morbilliform rash" "rubeola" "morbilli" "Koplik spots" "Coryza" ',
  "gastro" => ' "Gastroenteritis" "stomach flu" "gastroenteritides" "gastroenterities" "food poisoning" "campylobacter"  "colitis" "gastroenterocolitis"  "gastrointestinal disorder"  "gastrointestinal disease" "sick to stomach" "upset stomach" "vomit" "diarrhea and vomiting" "vomiting" "vomitting" "diarrhea and cramp" "diarrheas" "diarrhoea" "norovirus" "rotavirus" "gastritis" "stomach bug" "stomach virus" "intestinal illness" "intestinal sickness" ',
  "yellow_fever" => ' "Yellow Fever" "Yellow Jack" "Black Vomit" ',
  "typhoid" => ' "Typhoid" "Enteric Fever" "Typhoid Fever" "Salmonelle typhi" ',
  "tetanus" => ' "Tetanus" "Lockjaw" "#Tetanus" "#Lockjaw" ',
  "smallpox" => ' "Smallpox"  "#Smallpox" "Variola" "#Variola" '
}

@debug = false

def parse_tweet(tweet1)
  if tweet1["geo_lat"] != 0 && tweet1["geo_long"] != 0 && !tweet1["tweet_text"].nil? && !tweet1["geo_lat"].nil? && !tweet1["geo_long"].nil?
    selectTable(tweet1)
    return
  end
  if tweet1["location"].nil? || tweet1["location"].empty? || tweet1["location"] == ""
    @log3.add(Logger::INFO, "Failed for #{tweet1.to_json}", "parse_redis")
    puts "!!! No location: #{tweet1.to_json}"
    return
  end
  puts "!!! location: #{tweet1['location']}"
  loc = get_loc(tweet1["location"])
  tweet1["geo_lat"] = loc[:lat]
  tweet1["geo_long"] = loc[:lon]
  @log.add(Logger::DEBUG, tweet1, "parse_redis") if @debug
  if tweet1["geo_lat"] != 0 && tweet1["geo_long"] != 0 && !tweet1["geo_lat"].nil? && !tweet1["geo_long"].nil?
    selectTable(tweet1)
  end
end

def selectTable(tweet)
  tweet[:tables] = Array.new
  @terms.each do |term|
    term.each do |item|
      if tweet["tweet_text"].match /(^|\s+)#{item}(\s+|$)/i
        puts "!!! Tweet matched #{item}"
        tweet[:tables] << item
        break
      end
    end
  end
  begin
    tweet[:tables].each do |table|
      next if table.nil? || table == ""
      puts "!!! table: #{table}"
      id = tweet["tweet_id"]
      created = tweet["created_at"]
      geo_lat = tweet["geo_lat"]
      puts "!!! geo_lat #{geo_lat}"
      geo_long = tweet["geo_long"]
      puts "!!! geo_long #{geo_long}"
      text = @sql.escape_string(tweet["tweet_text"])
      begin
        @sql.query("insert into #{table} (tweet_id,created_at,geo_lat,geo_long,tweet_text,geom4326) values (#{id},'#{created}',#{geo_lat},#{geo_long},'#{text}',PointFromText('POINT(#{geo_long} #{geo_lat})', 4326))")
      rescue PG::Error => e
        @log.add(Logger::ERROR, e, "parse_redis")
        puts "!!! Error inserting: #{e}"
        return
      end
      @log4.add(Logger::INFO, "Inserted #{tweet.to_json}", "parse_redis")
      puts "!!! inserted #{tweet.to_json}"
    end
  end unless tweet[:tables].empty?
end


def main
  while true
    if @redis.llen('ready4geo') == 0
      sleep 2
      next
    end
    tweet = JSON.parse(@redis.lpop 'ready4geo')
    p tweet
    parse_tweet(tweet)
  end
end

def splitData
  File.open("/home/jeff/terms2.txt", "w") do |file|
    @terms.each do |k,v|
      v.gsub!(/\"\s+\"/,',')
      arr = v.gsub('"','').strip.split(',')
      file.puts "#{k}"
      #puts arr
    end
  end
end

main
