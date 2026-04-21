// weather.js file for forecast information integration on weather.html site
const city_name = 'Edison'; //later will be changed to get city and state name from user account
const state_name = 'New Jersey';
const apiKey = 'a605b2475cfb8472683b79415104d4d8';
const myheader = { 'User-Agent': 'GardenPal jt1118@scarletmail.rutgers.edu' };

import {icon_choice, day_abrv, month_abrv} from './constant_weather.js'; // import constants

async function getLatLong(city_name,state_name){
    const url_geo = `http://api.openweathermap.org/geo/1.0/direct?q=${city_name},${state_name}&limit=5&appid=${apiKey}`;
    try{
        const apiFetch = await fetch(url_geo);
        const apiData = await apiFetch.json();
        return apiData
    }catch(error){
        console.error('Error:',error);
    }
}

async function getWeather(url_weather, ifHrly = false){
    try{
        const apiFetch = await fetch(url_weather,{headers: myheader});
        const apiData = await apiFetch.json();
        if (ifHrly == true){
            const forecastUrl =  apiData.properties.forecastHourly;

            const forecast = await fetch(forecastUrl);
            const forecastData = await forecast.json();
                
            return forecastData.properties.periods.slice(0, 5); // hourly weather (for 5 hrs)
        }
        const forecastUrl =  apiData.properties.forecast;

        const forecast = await fetch(forecastUrl);
        const forecastData = await forecast.json();
            
        return forecastData.properties.periods.slice(0, 11).filter((_, index) => index % 2 === 0); // weekly weather
    }catch(error){
        console.error('Error:',error);
    }
}

async function loadWeather(){
    const url_weather = `http://api.weather.gov/points/${latlongDict[0].lat},${latlongDict[0].lon}`;
    var today_json = await getWeather(url_weather);
    var hrly_json = await getWeather(url_weather, true);

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
    document.getElementById("today-precip").innerHTML = hrly_json[0].probabilityOfPrecipitation.value;
    document.getElementById("today-humid").innerHTML = hrly_json[0].relativeHumidity.value || today_json[0].relativeHumidity; 
    document.getElementById("today-wind").innerHTML = hrly_json[0].windSpeed || today_json[0].windSpeed;
    document.getElementById("today-report").innerHTML = today_json[0].shortForecast;

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
    
    const response = await fetch("/api/ai-weather", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(today_json)
    });
    const ai_response = await response.json();
    document.getElementById("ai-message").innerHTML = ai_response.ai_message;
}

// load weather data into website
let latlongDict = await getLatLong(city_name,state_name);
loadWeather();

// Export weather data for precipitation graph in html page
export let today_json = await getWeather(`http://api.weather.gov/points/${latlongDict[0].lat},${latlongDict[0].lon}`, true);

//Promise.resolve(getWeather(`https://api.weather.gov/points/${latlongDict[0].lat},${latlongDict[0].lon}`)).then(
//    body=> console.log(body)
//);