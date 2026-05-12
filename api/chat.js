export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const { message, symptoms } = req.body;

  const prompt = `
You are the Poorly Pet AI assistant.

You help dog owners understand possible support areas.

IMPORTANT RULES:
- Never diagnose diseases
- Never replace a vet
- Never prescribe medication
- Keep answers calm, warm, professional and premium
- Suggest support categories only

Possible support areas:
- Joint & Mobility
- Internal Health
- Essential Care
- Behavioural
- Neurological
- Paws & Limbs
- Skin & Allergies
- Rehab

Symptoms:
${symptoms?.join(", ") || ""}

Customer message:
${message}

Structure your response like this:

1. Short reassuring introduction
2. "Support areas to explore"
3. "What to keep an eye on"
4. Gentle vet advice if symptoms worsen
5. Short encouraging closing line
`;

  try {
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content: prompt,
            },
          ],
          temperature: 0.7,
        }),
      }
    );

    const data = await response.json();

    res.status(200).json({
      answer: data.choices[0].message.content,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Something went wrong",
    });
  }
}
