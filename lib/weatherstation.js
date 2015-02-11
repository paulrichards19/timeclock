var request = require('request');
var phpjs = require('phpjs');

function weatherstation() {

    var $this = this;

    var city = '2654675';

    var latlong = 'lat=51.509517&lon=-2.642328';

    var forcast3hrUrl = "http://api.openweathermap.org/data/2.5/forecast?id="+city+"&units=metric";

    var forcastUrl = "http://api.openweathermap.org/data/2.5/forecast/daily?id="+city+"&mode=json&units=metric&cnt=3";
    var weatherUrl = "http://api.openweathermap.org/data/2.5/weather?"+latlong+"&mode=json&units=metric";

    var current_weather = {
        today : {
        },
        tomorrow: {
        },
        day_after: {
        }
    };

    loopWeather();
    setInterval(loopWeather, (60000*5));

    function loopWeather(){

        // today
        request(weatherUrl, function(error, response, body) {
            if (!error && response.statusCode == 200 & body != "") {

                var json_data = JSON.parse(body);

                current_weather.today = {
                    weather:{
                        temp: phpjs.round(json_data.main.temp,1),
                        pressure: json_data.main.pressure,
                        humidity: json_data.main.humidity,
                        sky: json_data.weather[0].main,
                        sky_desc: json_data.weather[0].description,
                        sky_icon: json_data.weather[0].icon,
                        wind_speed_kph: phpjs.round(json_data.wind.speed,1),
                        wind_speed_mph: phpjs.round(json_data.wind.speed * (5/8),1),
                        wind_direction: json_data.wind.deg
                    }
                };

            }else{
                // no update something went wrong
                console.log('Error contacting weather api');
            }
        });

        //tomorrow & day after
        request(forcastUrl, function(error, response, body) {
            if (!error && response.statusCode == 200 & body != "") {

                var json_data = JSON.parse(body);

                current_weather.tomorrow = {
                    weather:{
                        temp: json_data.list[1].temp.day,
                        pressure: json_data.list[1].pressure,
                        humidity: json_data.list[1].humidity,
                        sky: json_data.list[1].weather.main,
                        sky_desc: json_data.list[1].weather.description,
                        sky_icon: json_data.list[1].weather.icon,
                        wind_speed_kph: phpjs.round(json_data.list[1].speed,1),
                        wind_speed_mph: phpjs.round(json_data.list[1].speed * (5/8),1),
                        wind_direction: json_data.list[1].deg
                    }
                };

                current_weather.day_after = {
                    weather:{
                        temp: json_data.list[2].temp.day,
                        pressure: json_data.list[2].pressure,
                        humidity: json_data.list[2].humidity,
                        sky: json_data.list[2].weather.main,
                        sky_desc: json_data.list[2].weather.description,
                        sky_icon: json_data.list[2].weather.icon,
                        wind_speed_kph: phpjs.round(json_data.list[2].speed,1),
                        wind_speed_mph: phpjs.round(json_data.list[2].speed * (5/8),1),
                        wind_direction: json_data.list[2].deg
                    }
                }

            }else{
                // no update something went wrong
            }
        });

    }

    $this.getData = function(callback){
        return current_weather;
    }

}

module.exports = weatherstation;