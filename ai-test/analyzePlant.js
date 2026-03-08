import dotenv from "dotenv";
dotenv.config();

export async function analyzePlant(plant) {
    const prompt = `You are a horticulture expert. 
    Analyze this plant's health.

    Plant type: ${plant.type}s
    Moisture: ${plant.moisture}%
    Sunlight: ${plant.sunlight} hours
    Temperature: ${plant.temperature}degrees F

    Return ONLY valid JSON. 
    Do NOT include explanations, markdown, commentary, or text outside the JSON object.
    If you include anything other than JSON, the system will break.
    Return ONLY valid JSON with:
    {
        "status": "healthy | needs-water | at-risk",
        "reason": "short explanation",
        "action": "recommended next step",
        "confidence": number between 0 and 1
    }
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
                { role: "system", content: "You are a plant expert."},
                { role: "user", content: prompt }
            ],
            temperature: 0.2        
        })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;

    try{
        return JSON.parse(content);
    } catch (err) {
        console.error("AI returned invalid JSON:", content);
        return{
            status: "unknown",
            reason: "AI returned invalid JSON",
            action: "none",
            confidence: 0
        };
    }
}