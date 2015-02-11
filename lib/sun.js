var _ = require('underscore');
var mysql = require('mysql');
var Suncal = require('./suncalc');
var phpjs = require('phpjs');
var moment = require('moment');

function sun() {

    var $this = this;

    // config the Sun runner - Convent close
    var lat = "51.509466";
    var long = "-2.642305";

    $this.getData = function() {

        // today
        var d = new Date();
        var today = Suncal.getTimes(d, lat, long);

        var day_length = ( parseInt(today.dusk.getTime() ) - parseInt(today.dawn.getTime() ) );
        var day_moment = moment.duration(day_length);
        var civil_day_length_today = day_moment.hours() + ' hours ' + day_moment.minutes() + ' mins';
        var civil_day_length_today_short = day_moment.hours() + ' h ' + day_moment.minutes() + ' m';

        // how long of daylight left?
        var civil_day_length_left = ( parseInt(today.dusk.getTime() ) -  new Date().getTime() ) ;
        var day_moment_left = moment.duration(civil_day_length_left);
        var civil_day_length_left = day_moment_left.hours() + ' hours ' + day_moment_left.minutes() + ' mins';

        // tomorrow
        var d2 = new Date();
        d2.setDate(d2.getDate() + 1);
        var tomorrow = Suncal.getTimes(d2, lat, long);

        var day_length = ( parseInt(tomorrow.dusk.getTime() ) - parseInt(tomorrow.dawn.getTime() ) );
        var day_moment = moment.duration(day_length);
        var civil_day_length_tomorrow = day_moment.hours() + ' hours ' + day_moment.minutes() + ' mins';

        // day_after
        var d3 = new Date();
        d3.setDate(d3.getDate() + 2);
        var day_after = Suncal.getTimes(d3, lat, long);

        var day_length = ( parseInt(day_after.dusk.getTime() ) - parseInt(day_after.dawn.getTime() ) );
        var day_moment = moment.duration(day_length);
        var civil_day_length_day_after = day_moment.hours() + ' hours ' + day_moment.minutes() + ' mins';


        var current_sun = {
            today: {
                sun: {
                    date: phpjs.date("D jS M", parseInt(d.getTime() / 1000)),
                    civil_start_r: parseInt(today.dawn.getTime() / 1000),
                    civil_end_r: parseInt(today.dusk.getTime() / 1000),
                    civil_start: phpjs.date("H:i", parseInt(today.dawn.getTime() / 1000)),
                    civil_end: phpjs.date("H:i", parseInt(today.dusk.getTime() / 1000)),
                    civil_day_length: civil_day_length_today,
                    civil_day_length_short: civil_day_length_today_short,
                    civil_day_length_left: civil_day_length_left
                }

            },
            tomorrow: {
                sun: {
                    date: phpjs.date("D jS M", parseInt(d2.getTime() / 1000)),
                    civil_start_r: parseInt(tomorrow.dawn.getTime() / 1000),
                    civil_end_r: parseInt(tomorrow.dusk.getTime() / 1000),
                    civil_start: phpjs.date("H:i", parseInt(tomorrow.dawn.getTime() / 1000)),
                    civil_end: phpjs.date("H:i", parseInt(tomorrow.dusk.getTime() / 1000)),
                    civil_day_length: civil_day_length_tomorrow
                }

            },
            day_after: {
                sun: {
                    date: phpjs.date("D jS M", parseInt(d3.getTime() / 1000)),
                    civil_start_r: parseInt(day_after.dawn.getTime() / 1000),
                    civil_end_r: parseInt(day_after.dusk.getTime() / 1000),
                    civil_start: phpjs.date("H:i", parseInt(day_after.dawn.getTime() / 1000)),
                    civil_end: phpjs.date("H:i", parseInt(day_after.dusk.getTime() / 1000)),
                    civil_day_length: civil_day_length_day_after
                }

            }
        };
        // ave the lot ?
        //current_sun.today.push(today);
        return current_sun;

    }

}

module.exports = sun;