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