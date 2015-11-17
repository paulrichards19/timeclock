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
    .option('-d, --deleteall', 'Delete the log collection')
    .option('-m, --deletemobile', 'Delete the mobile collection')
    .parse(process.argv);

var DatastoreClass = require('./lib/datastore');
var datastore = new DatastoreClass();

if( program.deletesensor ){
    datastore.deleteCollection('sensors');
}

if( program.deletelog ){
    datastore.deleteCollection('log');
}

if( program.deleteall ){
    datastore.deleteCollection('log');
    datastore.deleteCollection('sensors');
    datastore.deleteCollection('mobile');
}

if( program.deletemobile ){
    datastore.deleteCollection('mobile');
}

if( program.resetschedule ){
    datastore.resetSchedule();
}