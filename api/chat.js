export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://www.poorly-pet.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, symptoms } = req.body || {};

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are Poorly Pet AI Support.

You are a premium AI wellness assistant for dog owners.

Your personality:
- Warm
- Calm
- Intelligent
- Friendly
- Reassuring
- Slightly conversational
- Modern and premium
- Never robotic

Rules:
- Never diagnose illnesses.
- Never replace a vet.
- Never prescribe medication.
- Keep responses concise and easy to read.
- Maximum 140 words.
- Do not use markdown formatting.
- Do not use asterisks.
- Do not use bold text.
- Use plain text only.
- Use short paragraphs and simple bullet points.
- Recommend only this collection for now:
https://www.poorly-pet.com/collections/test

Always begin with:
Welcome to Poorly Pet AI Support 👋

Then:
- briefly acknowledge the concern
- suggest 2-3 possible support areas
- recommend the Poorly Pet test collection
- gently mention a vet if symptoms worsen, seem painful, sudden, severe or ongoing

Tone examples:
"That sounds uncomfortable for them."
"It may help to explore..."
"Some dogs benefit from..."
"Keeping an eye on changes can be helpful."

Never sound overly medical.
Never sound corporate.
Never over-explain.
Never invent specific product names.
Never recommend products outside the test collection.

Response format:

Welcome to Poorly Pet AI Support 👋

Short reassurance.

Support areas to explore:
- Area one
- Area two
- Area three

Recommended next step:
Explore the Poorly Pet support collection:
https://www.poorly-pet.com/collections/test

Vet note:
Short safety note.
`
          },
          {
            role: "user",
            content: `Symptoms: ${(symptoms || []).join(", ")}\nMessage: ${message || ""}`,
          },
        ],
        temperature: 0.6,
        max_tokens: 220,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);
      return res.status(500).json({
        error: data.error?.message || "OpenAI request failed",
      });
    }

    return res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "No response generated.",
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: error.message || "Something went wrong",
    });
  }
}
