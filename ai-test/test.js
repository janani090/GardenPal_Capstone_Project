import { mergePlantData } from "./mergePlantData.js";
import { analyzePlant } from "./analyzePlant.js";

async function runTest() {
    const merged = mergePlantData();

    console.log("Merged plant data:");
    console.log(merged);

    console.log("\nAI Analysis: \n");

    for (const plant of merged) {
        const result = await analyzePlant(plant);
        console.log(`Plant ${plant.plantId} (${plant.name}):`);
        console.log(result);
        console.log("----")
    }
}

runTest();