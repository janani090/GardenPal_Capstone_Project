// weather.js file for forecast information integration on weather.html site
const url_geo = 'http://api.openweathermap.org/geo/1.0/direct?q={city_name}&limit=5&appid={api_key}';
const url_weather = 'https://api.weather.gov/points/40.54,-74.36';
const apiKey = 'a605b2475cfb8472683b79415104d4d8';
const myheader = { 'User-Agent': 'GardenPal jt1118@scarletmail.rutgers.edu' };

const day_abrv = {
    'Sunday':'Sun',
    'Monday':'Mon',
    'Tuesday':'Tue',
    'Wednesday':'Wed',
    'Thursday':'Thur',
    'Friday':'Fri',
    'Saturday':'Sat'};

const icon_choice = {
    "skc": {
        "description": "Fair/clear",
        "img" : ["night","sunny"]
        },
    "few": {
        "description": "A few clouds",
        "img" : "cloudy"
        },
    "sct": {
        "description": "Partly cloudy",
        "img" : "cloudy"
        },
    "bkn": {
        "description": "Mostly cloudy",
        "img" : "cloudy"
        },
    "ovc": {
        "description": "Overcast",
        "img" : "cloudy"
        },
    "wind_skc": {
        "description": "Fair/clear and windy",
        "img" : "sunny"
        },
    "wind_few": {
        "description": "A few clouds and windy",
        "img" : "sun-cloud"
        },
    "wind_sct": {
        "description": "Partly cloudy and windy",
        "img" : "sun-cloud"
        },
    "wind_bkn": {
        "description": "Mostly cloudy and windy",
        "img" : "cloudy"
        },
    "wind_ovc": {
        "description": "Overcast and windy",
        "img" : "cloudy"
        },
    "snow": {
        "description": "Snow",
        "img" : "snowy"
        },
    "rain_snow": {
        "description": "Rain/snow",
        "img" : "sleet"
        },
    "rain_sleet": {
        "description": "Rain/sleet",
        "img" : "sleet"
        },
    "snow_sleet": {
        "description": "Snow/sleet",
        "img" : "snow"
        },
    "fzra": {
        "description": "Freezing rain",
        "img" : "sleet"
        },
    "rain_fzra": {
        "description": "Rain/freezing rain",
        "img" : "rainy"
        },
    "snow_fzra": {
        "description": "Freezing rain/snow",
        "img" : "sleet"
        },
    "sleet": {
        "description": "Sleet",
        "img" : "sleet"
        },
    "rain": {
        "description": "Rain",
        "img" : "rainy"
        },
    "rain_showers": {
        "description": "Rain showers (high cloud cover)",
        "img" : "rainy"
        },
    "rain_showers_hi": {
        "description": "Rain showers (low cloud cover)",
        "img" : "sun-rain-cloud"
        },
    "tsra": {
        "description": "Thunderstorm (high cloud cover)",
        "img" : "thunderstorm"
        },
    "tsra_sct": {
        "description": "Thunderstorm (medium cloud cover)",
        "img" : "thunderstorm"
        },
    "tsra_hi": {
        "description": "Thunderstorm (low cloud cover)",
        "img" : "thunderstorm"
        },
    "tornado": {
        "description": "Tornado",
        "img" : "thunderstorm"
        },
    "hurricane": {
        "description": "Hurricane conditions",
        "img" : "thunderstorm"
        },
    "tropical_storm": {
        "description": "Tropical storm conditions",
        "img" : "thunderstorm"
        },
    "dust": {
        "description": "Dust",
        "img" : "cloudy"
        },
    "smoke": {
        "description": "Smoke",
        "img" : "cloudy"
        },
    "haze": {
        "description": "Haze",
        "img" : "cloudy"
        },
    "hot": {
        "description": "Hot",
        "img" : "sunny"
        },
    "cold": {
        "description": "Cold",
        "img" : "snowy"
        },
    "blizzard": {
        "description": "Blizzard",
        "img" : "snowy"
        },
    "fog": {
        "description": "Fog/mist",
        "img" : "cloudy"
        }
}

const month_abrv = ['Jan','Feb','Mar','Apr','May','June','July','Aug','Sept','Oct','Nov','Dec'];

async function getLatLong(city,state){
    try{
        const apiFetch = await fetch(url_geo,apiKey); // ?
    }catch(error){
        console.error('Error:',error);
    }
}

async function getWeekWeather(){
    try{
        const apiFetch = await fetch(url_weather,{headers: myheader});
        const apiData = await apiFetch.json();
        const forecastUrl =  apiData.properties.forecast;

        const forecast = await fetch(forecastUrl);
        const forecastData = await forecast.json();
            
        return forecastData.properties.periods.slice(0, 11).filter((_, index) => index % 2 === 0); // weekly weather
    }catch(error){
        console.error('Error:',error);
    }
}

async function loadWeather(){

    var today_json = await getWeekWeather();

    const date = new Date(today_json[0].startTime);
    const day_name = date.toLocaleDateString('en-US', { weekday: 'long' });
    const day_num = date.getDate();
    const day_month = month_abrv[date.getMonth()];
    const iconKey = today_json[0].icon.split("/").pop().split("?")[0].split(",")[0];
    const iconImg = icon_choice[iconKey]?.img || "sunny";

    document.getElementById("today-month").innerHTML = day_month;
    document.getElementById("today-day-num").innerHTML = day_num;

    document.getElementById("today-day").innerHTML = day_name;
    document.getElementById("today-temp").innerHTML = today_json[0].temperature;
    document.getElementById("today-img").innerHTML =`<img src="./weather-icon-${iconImg}.png">`;
    document.getElementById("today-precip").innerHTML = today_json[0].probabilityOfPrecipitation.value;
    //document.getElementById("today-humid").innerHTML = today_json[0];
    document.getElementById("today-wind").innerHTML = today_json[0].windSpeed;
    document.getElementById("today-report").innerHTML = today_json[0].detailedForecast;

    for (let i = 1; i <= 5; i++) {
        const date = new Date(today_json[i].startTime);
        const day_name = date.toLocaleDateString('en-US', { weekday: 'long' });
        const iconKey = today_json[i].icon.split("/").pop().split("?")[0].split(",")[0];
        const iconImg = icon_choice[iconKey]?.img || "sunny";
        const iconDescp = icon_choice[iconKey]?.description || "Error";
        
        document.getElementById(`day-${i}-title`).innerHTML = day_abrv[day_name];
        document.getElementById(`day-${i}-img`).innerHTML =`<img src="./weather-icon-${iconImg}.png">`;
        document.getElementById(`day-${i}-temp`).innerHTML = today_json[i].temperature;
        document.getElementById(`day-${i}-report`).innerHTML = iconDescp;
    }

}

loadWeather();

//Promise.resolve(getWeekWeather()).then(
//    body=> console.log(body)
//)