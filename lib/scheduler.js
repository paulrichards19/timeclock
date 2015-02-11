
var _ = require('lodash');
var moment = require('moment');
var schedule = require('node-schedule');


var DatastoreClass = require('./datastore');
var datastore = new DatastoreClass();

function scheduler(datastore, eventEmitter) {

    var $this = this;

    // default heating status
    var heating_status = 0;

    // schedule
    var scheduleCollection = [];

    // tell the relay and LED the first time to be off
    eventEmitter.emit('change:heat', 0);

    // listen for the switch pressed
    eventEmitter.on('pressed:switch',function(){

        console.log('button toggled');

        if(heating_status == 1){
            heatOff('switch');
        }else{
            heatOn('switch');
        }

    });

    // listen for the API action
    eventEmitter.on('toggle:api',function(state){

        console.log('API toggled');

        if(heating_status == 1 && state == 0){
            heatOff('api');
        }else if( heating_status == 0 && state == 1 ){
            heatOn('api');
        }

    });


    // run the schedule builder to ensure there is something when first booted.
    createSchedule();

    // create a new schedule everyday
    var reJob = schedule.scheduleJob({hour: 4, minute: 0, dayOfWeek: new schedule.Range(0, 6)}, function(){
        createSchedule();
    });

    function createSchedule(){

        console.log('Recreating schedule for today');

        datastore.getCompleteSchedule(function(presets){

            // remove any presets from the collection first
            removePresetFromCurrentJobs();

            _.each( presets, function(preset){

                var current_day = moment().format('ddd').toLowerCase();

                if( preset.day.indexOf(current_day) ){

                    var date1 = moment().minute(preset.time.minute).hour(preset.time.hour).second(0);

                    if( date1.diff(moment()) > 0 ){

                        var j = schedule.scheduleJob(date1.toDate(), function(options){
                            console.log(arguments);

                            if( options.heat == 1 ){
                                heatOn('preset');
                            }

                            if( options.heat == 0 ){
                                heatOff('preset');
                            }

                        }.bind(null,preset));

                        // save this schedule
                        scheduleCollection.push({
                            id: _.uniqueId(),
                            job: j,
                            options: preset,
                            date: date1.toDate(),
                            type: 'preset'
                        });


                    }else{
                        console.log('preset is in the past');
                    }

                }

            });

        });

    };

    function removePresetFromCurrentJobs(){

        if( scheduleCollection.length > 0 ){

            _.remove(scheduleCollection, function(n) {

                if( n.type == 'preset' ){
                    n.job.cancel();
                    return true;
                }else{
                    return false;
                }

            });

        }

    };

    function heatOn(type){

        console.log('Heating ON');
        heating_status = 1;
        eventEmitter.emit('change:heat', 1);

        // record it
        var data = {
            type: type,
            heat: 1,
            date: new Date
        };

        datastore.saveHeatingChange(data);

    }

    function heatOff(type){

        console.log('Heating OFF');
        heating_status = 0;
        eventEmitter.emit('change:heat', 0);

        // record it
        var data = {
            type: type,
            heat: 0,
            date: new Date
        };

        datastore.saveHeatingChange(data);

    }

    $this.getFutureSchedule = function( date, callback ){

        var futureSchedule = [];

        datastore.getCompleteSchedule(function(presets){

            _.each( presets, function(preset){

                var current_day = moment(date).format('ddd').toLowerCase();
                // confusion 0 is valid find, -1 if nothing
                if( preset.day.indexOf(current_day) >= 0 ){

                    var date1 = moment(date).minute(preset.time.minute).hour(preset.time.hour).second(0);

                    // save this schedule
                    futureSchedule.push({
                        id: _.uniqueId('fs_'),
                        options: preset,
                        date: date1.toDate(),
                        type: 'preset'
                    });

                }

            });

            callback(futureSchedule);

        });
    };

    $this.getData = function(){

        var data = {};
        data.today = {};
        data.today.heat = {};
        data.today.heat.heating_status = heating_status;

        return data;

    };

}

module.exports = scheduler;