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

    const response = await fetch("https://www.poorly-pet.com/collections/test/products.json");

    if (!response.ok) {
      return res.status(500).json({ error: "Could not load products" });
    }

    const data = await response.json();
    const products = data.products || [];

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `
You are Poorly Pet's AI product recommender.

User symptoms:
${symptoms}

Choose up to 3 suitable products from this product list:
${JSON.stringify(products.map((p) => ({
  id: p.id,
  title: p.title,
  handle: p.handle,
  body_html: p.body_html,
  tags: p.tags,
  product_type: p.product_type
})))}

Return ONLY valid JSON:
{
  "product_handles": ["handle-1", "handle-2", "handle-3"]
}

No explanation. No markdown.
        `
      })
    });

    const aiData = await openaiResponse.json();

    if (!openaiResponse.ok) {
      return res.status(500).json({ error: aiData.error?.message || "OpenAI failed" });
    }

    const text = aiData.output_text || "{}";
    const parsed = JSON.parse(text);

    const recommended = products
      .filter((product) => parsed.product_handles.includes(product.handle))
      .slice(0, 3)
      .map((product) => ({
        title: product.title,
        handle: product.handle,
        url: `/products/${product.handle}`,
        image: product.images?.[0]?.src || "",
        price: product.variants?.[0]?.price || "",
        vendor: product.vendor || ""
      }));

    return res.status(200).json({
      products: recommended
    });
  } catch (error) {
    return res.status(500).json({
      error: "Recommendation failed"
    });
  }
}
