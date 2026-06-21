import { GoogleGenerativeAI } from '@google/generative-ai'

let _model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null
let _streamingModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null

function getModels() {
  if (!_model) {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
    _model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      generationConfig: { temperature: 0.7 },
    })
    _streamingModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      generationConfig: { temperature: 0.8 },
    })
  }
  return { model: _model!, streamingModel: _streamingModel! }
}

export const model = new Proxy({} as ReturnType<GoogleGenerativeAI['getGenerativeModel']>, {
  get(_, prop) {
    return Reflect.get(getModels().model, prop)
  },
})

export const streamingModel = new Proxy({} as ReturnType<GoogleGenerativeAI['getGenerativeModel']>, {
  get(_, prop) {
    return Reflect.get(getModels().streamingModel, prop)
  },
})
