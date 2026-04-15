// api/ai.js
export default async function handler(req, res) {
  // Garantir que a resposta é JSON
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const { mensagem } = req.body;

    if (!mensagem) {
      return res.status(400).json({ error: 'Mensagem não fornecida.' });
    }

    // Chamada à API do OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "openai/gpt-4o-mini",
        "messages": [
          { "role": "user", "content": mensagem }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Erro na comunicação com a IA");
    }

    const data = await response.json();
    const textoIA = data.choices[0].message.content;

    // Retorna a resposta no formato esperado
    return res.status(200).json({
      resposta: textoIA
    });

  } catch (error) {
    console.error("Erro na API (/api/ai):", error);
    return res.status(500).json({ error: error.message });
  }
}
