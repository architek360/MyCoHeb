(ns get-tweets.core
  (:gen-class)
  (:use [twitter.oauth]
        [twitter.callbacks]
        [twitter.callbacks.handlers]
        [twitter.api.streaming]
        [clojure.tools.logging :only (info)]
        clojure.pprint)
  (:require [clojure.data.json :as json]
            [http.async.client :as ac]
            [clojure.string :as string]
            [clj-redis.client :as redis])
  (:import (twitter.callbacks.protocols
            AsyncStreamingCallback)))

(def track-words "influenza,Flu,adenovirus,h1n1,h3n2,h5n1,ah1n1,Gastroenteritis,stomach flu,gastroenteritides,gastroenterities,food poisoning,campylobacter,colitis,gastroenterocolitis,gastrointestinal disorder,gastrointestinal disease,sick to stomach,upset stomach,vomit,diarrhea and vomiting,vomiting,vomitting,diarrhea and cramp,diarrheas,diarrhoea,norovirus,rotavirus,gastritis,stomach bug,stomach virus,intestinal illness,intestinal sickness,Measles,measle,morbilliform rash,rubeola,morbilli,Koplik spots,Coryza,Pneumonia,pneum,pneumococcal,bronchopneumonia,pneumocystis,lung infection,chest infection,walking pneumonia,Tuberculosis,TB,tuberculose,tuberculoses,tuberculosi,MDR TB,XDR TB,TDR TB,BCG vaccine,BCG vaccination,Potts disease,tuberculosys,tuberculous,consumption,Kochs disease,phthisis,Mantoux test,Pertussis,pertuss,whooping cough,pertusses,bordetella,whoop,whooping,whoops,bordetellosis,croup,paroxysmal cough,paroxysmal coughing,Varicella,chicken pox,chickenpox,herpes zoster,herpes virus 3,herpesvirus 3,varicella zoster,varicellovirus,herpes varicella,shingles,zoster,VZV,Meningitis,meningiti,meningitide,meningitides,brain infection,neisseria menngitidis,meningities,encephalitis,Hib,lymphocytic choriomeningitis,LCMV,choriomeningitis,LCM,meningococcal,mollarets,meningitys,meningococcus,meningoencephalitis,encephalities,tick borne disease,tick virus,tick fever,tick paralysis,babesiosis,ehrlichiosis,lyme disease,Rocky Mountain Spotted Fever,RMSF,Anaplasmosis,rickettsiosis,STARI,Southern Tick-Associated Rash Illness,TBRF,Tickborne Relapsing Fever,tularemia,relapsing fever,Cholera,vibrio cholera,choleragen,choleras,Dengue,dengue fever,dengue haemorrhagic fever,dengue hemorrhagic fever,dengue virus,Common Cold,Cold,colds,respiratory tract infection,rhinovirus,nasopharyngitis,rhinopharyngitis,runny nose,pharyngitis,sinusitis,nasal congestion,URI,upper respiratory infection,HRV,coronavirus,URTI,Sexually Transmitted Disease,STD,chlamydia,psitacci,the clap,trachomatis,gonorrhea,herpes,HIV,AIDS,Human Papillomavirus,HPV,Pelvic Inflammatory Disease,PID,Syphilis,Trichomoniasis,Bacterial Vaginosis,BV,Public Lice,Public Crabs,herp,trich,Hepatitis,drip,personal problem,nature problem,urinary infection,kidney infection,discharge,Legionella,Pontiac Fever,Legionnaires Disease,legionellosis,Malaria,Plasmodium,blackwater fever,falciparum,biduoterian fever,mosquito borne disease,West Nile Virus,WNV,mosquito virus,west nile encephalitis,west nile fever,west nile,equine encephalitis,EEE,la crosse encephalitis,japanese encephalitis,st. louis encephalitis,WEE,anthrax,Diphtheria,Mumps,acute viral parotitis,epidemic partotitis,Polio,poliomyelitis,infantile paralysis,poliovirus,Rabies,lyssa,Smallpox,Variola,Tetanus,Lockjaw,Typhoid,Enteric Fever,Typhoid Fever,Salmonelle typhi,Yellow Fever,Yellow Jack,Black Vomit")

(def db
  "Local Redis database"
  (redis/init))
(def redis-store "ready4geo")
(def ^:dynamic *creds*
  "OAuth2 credentials for twitter"
  (make-oauth-creds ""
                    ""
                    ""
                    ""))

(defn trackwords
  "Splits up the ugly string constant up above."
  []
  (let [trackwords (string/split track-words #",")]
    trackwords))

(defn start-stream
  "It does what it says and says what it does"
  []
  (def ^:dynamic *response* (user-stream :oauth-creds *creds*))
  (Thread/sleep 60000)
  ((:cancel (meta *response*))))

(defn to-ruby
  "More verbose than needed, but at least it's clear.
Going with the same names from the existing ruby program."
  [tweet]
  (let [tw {
            :tweet_id (tweet :id)
            :tweet_text (tweet :text)
            :geo_lat (get-in tweet [:geo :lat])
            :geo_long (get-in tweet [:geo :lon])
            :location (get-in tweet [:user :location])
            :created_at (tweet :created_at)
            :time_zone (get-in tweet [:user :time_zone])
            :place (tweet :place)
            :coordinates (tweet :coordinates)
            :utc_offset (get-in tweet [:user :utc_offset])}]
    tw))

(defn handle-tweets
  "This will weed out the tweets we don't want then turn them into
something ruby can use and pushes them to redis as json."
  [response baos]
  (let [tweet (json/read-json (str baos))]
    (cond
     (contains? tweet :retweet_status) (info (str "Dropped " (tweet :id) " retweet"))
     (not= "en" (get-in tweet [:user :lang])) (info (str "Dropped " (tweet :id) " not english"))
     :else (let [rtweet (to-ruby tweet)
                 jtweet (json/json-str rtweet)]
             (redis/rpush db redis-store jtweet)))))

(def ^:dynamic *custom-streaming-callback*
    (AsyncStreamingCallback. #(handle-tweets % %2)
                             (comp println response-return-everything)
                             exception-print))

(defn -main [& args]
  (statuses-filter :params {:track (trackwords)}
                   :oauth-creds *creds*
                   :callbacks *custom-streaming-callback*))
