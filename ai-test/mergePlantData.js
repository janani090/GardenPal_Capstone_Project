import plantMap from "./plant-map.json" assert {type: "json"};
import mockSensorData from "./mock-data-one.json" assert {type: "json"};

export function mergePlantData() {
    return mockSensorData.map(reading => {
        const plantInfo = plantMap[reading.plantId];

        return{
            ...reading,
            ...plantInfo
        }
    });
}