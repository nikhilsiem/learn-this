import OpenAI from 'openai'

const openai = new OpenAI({
  baseURL: 'https://api.mistral.ai/v1',
  apiKey: process.env.MISTRAL_API_KEY!,
})

const MODEL = 'mistral-small-latest'

function wrapStream(stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>) {
  return {
    async *[Symbol.asyncIterator](): AsyncIterator<{ text: () => string }> {
      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content
        if (delta) yield { text: () => delta }
      }
    },
  }
}

export const model = {
  async generateContent(prompt: string) {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = completion.choices?.[0]?.message?.content ?? ''
    return { response: { text: () => text } }
  },
}

export const streamingModel = {
  async generateContentStream(prompt: string) {
    const stream = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    })
    return { stream: wrapStream(stream) }
  },

  startChat({ history }: { history: Array<{ role: string; parts: Array<{ text: string }> }> }) {
    const messages: Array<OpenAI.Chat.ChatCompletionMessageParam> = history.map(m => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.parts.map(p => p.text).join(''),
    }))

    return {
      sendMessageStream: async (message: string) => {
        const stream = await openai.chat.completions.create({
          model: MODEL,
          max_tokens: 4096,
          messages: [...messages, { role: 'user', content: message }],
          stream: true,
        })
        return { stream: wrapStream(stream) }
      },
    }
  },
}
