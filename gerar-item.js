export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const { tipo, raridade, nome } = req.body

    const prompts = {
      avatar: `high quality anime avatar ${raridade}, character portrait, aesthetic, detailed, purple neon highlights, solid background`,
      moldura: `circular anime frame ${raridade}, glowing purple border, neon aesthetic, centered, white background for easy cutout`,
      capa_fundo: `background anime fantasy landscape ${raridade}, wide view, immersive atmosphere, purple and blue tones`,
      nickname: `stylized text "${nome}", neon purple glowing letters, futuristic anime style, black background`
    }

    const response = await fetch(
      "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: prompts[tipo] || prompts.avatar
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erro na Hugging Face: ${errorText}`)
    }

    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString("base64")

    res.status(200).json({
      image: `data:image/png;base64,${base64}`
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: error.message
    })
  }
}
