var _ = require('lodash');
var phpjs = require('phpjs');
var moment = require('moment');
var async = require('async');

var MongoClient = require('mongodb').MongoClient;

var url = 'mongodb://192.168.0.6:27017/heating';

function datastore() {

    var $this = this;

    function connect(callback){

        MongoClient.connect(url, function(err, db) {
            callback(err, db);
        });

    }

    $this.saveHeatingChange = function( data ){

        connect(function(err, db) {

            var sensors = db.collection('log');

            /*
             var data = {
             type: 'preset|switch|api'
             heat: '1|0'
             date: new Date
             };*/

            sensors.save(data,function(){
                db.close();
            });

        });

    };

    $this.getHeatingLog = function(callback){

        connect(function(err, db) {

            var collection = db.collection('log');

            var data1 = collection.find().sort( { date: -1 }).limit(100);

            data1.toArray(function(error,doc1){
                callback( doc1 );
            });
        });

    };

    $this.getSensorLog = function(callback){

        connect(function(err, db) {

            var collection = db.collection('sensors');

            var data1 = collection.find().sort( { date: -1 }).limit(100);

            data1.toArray(function(error,doc1){
                callback( doc1 );
            });
        });

    };

    $this.saveSensorReading = function( data ){

        connect(function(err, db) {

            var sensors = db.collection('sensors');

            /*
            var data = {
                type: 'dht22',
                temperature: 21.5,
                humidity: 41.5,
                date: new Date
            };*/

            sensors.save(data,function(){
                db.close();
            });

        });

    };

    // get schedule collection

    $this.getCompleteSchedule = function(callback){

        connect(function(err,db){

            var collection = db.collection('schedule');

            var data = collection.find();

            data.toArray(function(error,doc1){
                callback( doc1 );
            });

        });

    };

    $this.getSchedule = function(callback){

        connect(function(err,db){

            var current_time = parseInt( phpjs.date("Hi") );
            var current_day = phpjs.date("D").toLowerCase();

            console.log( current_time );
            console.log( current_day );

            var collection = db.collection('schedule');

            async.parallel([
                function(callback1){
                    var data1 = collection.find({direction: 'on', time: { $gte: current_time }, day: current_day } ).sort( { time: -1 }).limit(1);

                    data1.toArray(function(error,doc1){
                        callback1( null, doc1 );
                    });
                },
                function(callback2){
                    var data2 = collection.find({direction: 'off', time: { $gte: current_time }, day: current_day } ).sort( { time: -1 }).limit(1);

                    data2.toArray(function(error,doc2){
                        callback2( null, doc2 );
                    });
                }
            ], function(err, results){
                db.close();
                callback(results);
            });


        });

    };


    // schedule
    $this.resetSchedule = function(){

        connect(function(err,db){

            // delete the collection first
            var collection = db.collection('schedule');

            collection.remove({},function(){
                console.log( 'schedule removed' );

                // populate the collection with defaults
                collection.insert([
                    {
                        type: 'preset',
                        heat: 1,
                        day : [
                            'mon',
                            'tue',
                            'wed',
                            'thu',
                            'fri',
                            'sat',
                            'sun'
                        ],
                        time: {
                            hour: 6,
                            minute: 30
                        }
                    },
                    {
                        type: 'preset',
                        heat: 0,
                        day : [
                            'mon',
                            'tue',
                            'wed',
                            'thu',
                            'fri',
                            'sat',
                            'sun'
                        ],
                        time: {
                            hour: 10,
                            minute: 00
                        }
                    },

                    {
                        type: 'preset',
                        heat: 1,
                        day : [
                            'mon',
                            'tue',
                            'wed',
                            'thu',
                            'fri',
                            'sat',
                            'sun'
                        ],
                        time: {
                            hour: 18,
                            minute: 30
                        }
                    },
                    {
                        type: 'preset',
                        heat: 0,
                        day : [
                            'mon',
                            'tue',
                            'wed',
                            'thu',
                            'fri',
                            'sat',
                            'sun'
                        ],
                        time: {
                            hour: 22,
                            minute: 00
                        }
                    }

                ],function(){
                    console.log('Schedule reset');
                });

                db.close();

            });

        });

    };

    $this.deleteCollection = function(collectionToDelete){

        connect(function(err,db){

            var collection = db.collection(collectionToDelete);

            collection.remove({},function(){
                console.log( collectionToDelete + ' removed' );
                db.close();
            });

        });

    };

}

module.exports = datastore;