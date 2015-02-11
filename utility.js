#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');

program
    .version('0.0.1')
    .option('-t, --resetschedule', 'Resets the schedule collection to defaults')
    .option('-s, --deletesensor', 'Delete the sensor collection')
    .option('-l, --deletelog', 'Delete the log collection')
    .parse(process.argv);

var DatastoreClass = require('./lib/datastore');
var datastore = new DatastoreClass();

if( program.deletesensor ){
    datastore.deleteCollection('sensors');
}

if( program.deletelog ){
    datastore.deleteCollection('log');
}

if( program.resetschedule ){
    datastore.resetSchedule();
}



//
/*

 var date = moment().add(10, 's').toDate();

 console.log(date);
 var x = 'Tada!';

 var j = schedule.scheduleJob(date, function(y){
 console.log(arguments);
 }.bind(null,x,{test:'test'}));

 x = 'Changing Data';

 console.log( j );

 }

 module.exports = temperature;



 var schedule = require('node-schedule');
 console.log('test schedule');

 var rule = new schedule.RecurrenceRule();
 //rule.dayOfWeek = [0, new schedule.Range(4, 6)];
 rule.hour = 19;
 //rule.minute = 0;
 rule.second = null;

 var j = schedule.scheduleJob(rule, function(){
 console.log('CAlled');
 });

 console.log( JSON.stringify( j ) );
 */
