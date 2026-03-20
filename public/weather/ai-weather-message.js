import dotenv from "dotenv";
import express from "express";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/ai-weather', async (req, res) => {
    const today_json = req.body;
    if (!today_json || !today_json[0]) {
        return res.status(400).json({ error: "Invalid input format" });
    }

    const prompt = `You are a weather and horticulture expert. 
    Analyze the weather below...

    Temperature: ${today_json[0].temperature}
    Precipitation: ${today_json[0].probabilityOfPrecipitation.value}%
    Wind Speed: ${today_json[0].windSpeed}
    detailedForecast: ${today_json[0].detailedForecast}

    Return a JSON in the format
    {
        ai_message: "one to two sentences on how the weather may affect plants in a garden"
    }
    the string (one to two sentences) should be answered generally,something that an average
    homeowner can understand about their plants. DO NOT return anything other than a JSON 
    in the above format, thus no emojis, bullet points, ecetera in the short string.
    `;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
                { role: "system", content: "You are a plant and weather expert."},
                { role: "user", content: prompt }
            ],
            temperature: 0.2        
        })
    });

    const data = await response.json();
    const ai_response = data.choices[0].message.content;
    try {
        res.json({ ai_response });
    } catch (error) {
        console.error("Invalid AI response:", error);
        return res.status(500).json({ error: "Invalid AI response" });
    }
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});