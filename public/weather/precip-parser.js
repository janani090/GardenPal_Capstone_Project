// Functions to parse today_json and return labels and data for precipitation graph

export function getHours(today_json){
    let hours = [];
    for(let i = 0; i < 5; i++){
        const date = new Date(today_json[i].startTime);
        var t_hour = date.getHours();
        var ampm = t_hour >= 12 ? 'PM' : 'AM';
        t_hour = t_hour % 12;
        t_hour = t_hour ? t_hour : 12;
        hours.push(`${t_hour} ${ampm}`);
    }
    return hours;
}

export function getPrecipPercent(today_json){
    let precipPercent = [];
    for(let i = 0; i < 5; i++){
        precipPercent.push(today_json[i].probabilityOfPrecipitation.value);
    }
    return precipPercent;
}
