
var _ = require('lodash');
var moment = require('moment');
var schedule = require('node-schedule');
var phpjs = require('phpjs');


var DatastoreClass = require('./datastore');
var datastore = new DatastoreClass();

function scheduler(datastore, eventEmitter) {

    var $this = this;

    // Schedule can be in Manual or Auto mode
    // Auto is on, manual is off.
    var mode = 'off'; // auto|off

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

                    // check the job will be in the future or it will fire straight away
                    if( date1.diff(moment()) > 0 ){

                        var j = schedule.scheduleJob(date1.toDate(), function(options){
                            console.log(arguments);

                            // only switch is its in auto mode
                            if( mode == 'auto' ){
                                if( options.heat == 1 ){
                                    heatOn('preset');
                                }

                                if( options.heat == 0 ){
                                    heatOff('preset');
                                }
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

    $this.getCurrentSchedule = function(){

        return scheduleCollection;

    };

    $this.getTodayHistory = function( callback){

        var meta = {};

        datastore.getHeatingLogToday( function(history){

            if( heating_status == 1 ){

                _.each( history, function(value){

                    if( value.heat == 1 ){
                        // how long has it been on?
                        var now = moment();
                        var cameOn = moment( value.date )

                        var lengthOfTime = ( now.toDate() - cameOn.toDate() );
                        var onDuration = moment.duration(lengthOfTime);
                        var onLength = onDuration.hours() + 'h ' + onDuration.minutes() + 'm';

                        meta.onLength = onLength;
                        meta.onLength_time = phpjs.date("H:i", parseInt(cameOn.toDate().getTime() / 1000));;


                        // stop the loop
                        return false;

                    }

                });

            }


            // actions for off status
            if( heating_status == 0 ){
                _.each( history, function(value){

                    if( value.heat == 0){
                        // how long has it been on?
                        var now = moment();
                        var turnedOff = moment( value.date )

                        var lengthOfTime = ( now.toDate() - turnedOff.toDate() );
                        var onDuration = moment.duration(lengthOfTime);
                        var onLength = onDuration.hours() + 'h ' + onDuration.minutes() + 'm';

                        meta.offLength = onLength;
                        meta.offLength_time = phpjs.date("H:i", parseInt(turnedOff.toDate().getTime() / 1000));;


                        // stop the loop
                        return false;
                    }


                });
            }


            callback({data:history,meta:meta});

        });

    };

    $this.setMode = function( newMode ){

        console.log('New mode set to:');

        if( newMode != 'auto' && newMode != 'off' ){
            return false;
        }

        console.log(newMode);

        mode = newMode;
    };

    $this.getMode = function(){
        return mode;
    };

    $this.getData = function(callback){

        var data = {};
        data.today = {};
        data.today.heat = {};
        data.today.heat.heating_status = heating_status;

        data.today.heat.nextOff = '';
        data.today.heat.nextOn = '';


        // next on and off by schedule

        _.each( scheduleCollection, function(value){

            if( value.options.heat == 0 ){

                var now = moment();
                var nextOff = moment( value.date );

                var lengthOfTime = ( nextOff.toDate() - now.toDate() );
                var onDuration = moment.duration(lengthOfTime);
                var onLength = onDuration.hours() + 'h ' + onDuration.minutes() + 'm';

                data.today.heat.nextOff_time = phpjs.date("H:i", parseInt(nextOff.toDate().getTime() / 1000));
                data.today.heat.nextOff = onLength;
                data.today.mode = mode;
                return false;
            }

        });


        _.each( scheduleCollection, function(value){

            if( value.options.heat == 1 ){

                var now = moment();
                var nextOn = moment( value.date )

                var lengthOfTime = ( nextOn.toDate() - now.toDate() );
                var onDuration = moment.duration(lengthOfTime);
                var onLength = onDuration.hours() + 'h ' + onDuration.minutes() + 'm';

                data.today.heat.nextOn_time = phpjs.date("H:i", parseInt(nextOn.toDate().getTime() / 1000));
                data.today.heat.nextOn = onLength;
                return false;
            }

        });



        $this.getTodayHistory(function(history){

            data.today.heat.history = history;

            callback( data );


        });

    };

}

module.exports = scheduler;