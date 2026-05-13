export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://www.poorly-pet.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { symptoms } = req.body || {};

    if (!symptoms) {
      return res.status(400).json({ error: "No symptoms provided" });
    }

    const productResponse = await fetch("https://www.poorly-pet.com/collections/test/products.json");

    if (!productResponse.ok) {
      return res.status(500).json({ error: "Could not load Shopify products" });
    }

    const productData = await productResponse.json();
    const products = productData.products || [];

    if (!products.length) {
      return res.status(200).json({ products: [] });
    }

    const productList = products.map((p) => ({
      title: p.title,
      handle: p.handle,
      tags: p.tags,
      type: p.product_type,
      body: String(p.body_html || "").replace(/<[^>]*>/g, "").slice(0, 500)
    }));

    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "You are Poorly Pet's product matching engine. Return only valid JSON. No markdown. No explanation."
          },
          {
            role: "user",
            content: `
Customer symptoms: ${symptoms}

Products:
${JSON.stringify(productList)}

Choose the 3 best product handles.

Return exactly this JSON format:
{"handles":["product-handle-1","product-handle-2","product-handle-3"]}
            `
          }
        ]
      })
    });

    const aiData = await aiResponse.json();

    if (!aiResponse.ok) {
      return res.status(500).json({
        error: aiData.error?.message || "OpenAI request failed"
      });
    }

    const aiText =
      aiData.output_text ||
      aiData.output?.[0]?.content?.[0]?.text ||
      "";

    let handles = [];

    try {
      const cleaned = aiText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(cleaned);
      handles = Array.isArray(parsed.handles) ? parsed.handles : [];
    } catch (error) {
      handles = products.slice(0, 3).map((p) => p.handle);
    }

    const recommended = products
      .filter((p) => handles.includes(p.handle))
      .slice(0, 3)
      .map((p) => ({
        title: p.title,
        handle: p.handle,
        url: `/products/${p.handle}`,
        image: p.images?.[0]?.src || "",
        price: p.variants?.[0]?.price || "",
        vendor: p.vendor || ""
      }));

    return res.status(200).json({
      products: recommended.length ? recommended : products.slice(0, 3).map((p) => ({
        title: p.title,
        handle: p.handle,
        url: `/products/${p.handle}`,
        image: p.images?.[0]?.src || "",
        price: p.variants?.[0]?.price || "",
        vendor: p.vendor || ""
      }))
    });
  } catch (error) {
    return res.status(500).json({
      error: "Recommendation failed"
    });
  }
}
