const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("[Gemini] La variable de entorno GEMINI_API_KEY no está definida. Las funciones que usan Gemini fallarán hasta que la configures.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const model = genAI ? genAI.getGenerativeModel({ model: "gemini-2.5-flash" }) : null;

async function generateQuestionsFromText(contentText, totalQuestions) {
  if (!model) {
    throw new Error("Gemini no está configurado. Define GEMINI_API_KEY en config.env.");
  }

  const prompt = `
Eres un generador de exámenes para estudiantes de colegio.
Lee el siguiente texto y genera ${totalQuestions} preguntas de opción múltiple.
Devuelve SOLO un JSON válido con este formato exacto:

[
  {
    "questionText": "texto de la pregunta",
    "options": [
      { "letter": "A", "text": "opción A", "isCorrect": true },
      { "letter": "B", "text": "opción B", "isCorrect": false },
      { "letter": "C", "text": "opción C", "isCorrect": false },
      { "letter": "D", "text": "opción D", "isCorrect": false }
    ],
    "difficulty": "easy" | "medium" | "hard"
  }
]

No incluyas explicación ni texto fuera del JSON.

Texto base:
${contentText}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let questions;
  try {
    questions = JSON.parse(text);
  } catch (err) {
    console.warn("[Gemini][Text] Error al hacer JSON.parse directo. Intentando extraer JSON de la respuesta cruda.");
    console.log("[Gemini][Text] Respuesta cruda:", text);

    // Intentar extraer el primer bloque que parezca un array JSON
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        questions = JSON.parse(match[0]);
      } catch (innerErr) {
        console.error("[Gemini][Text] Error parseando bloque extraído como JSON:", innerErr, "Bloque:", match[0]);
        throw new Error("La respuesta de Gemini no es un JSON válido de preguntas.");
      }
    } else {
      console.error("[Gemini][Text] No se encontró ningún bloque JSON en la respuesta:", text);
      throw new Error("La respuesta de Gemini no es un JSON válido de preguntas.");
    }
  }

  if (!Array.isArray(questions)) {
    throw new Error("La respuesta de Gemini no es una lista de preguntas.");
  }

  return questions.slice(0, totalQuestions);
}

async function generateQuestionsFromImage(filePath, totalQuestions) {
  if (!model) {
    throw new Error("Gemini no está configurado. Define GEMINI_API_KEY en config.env.");
  }

  const absolutePath = path.resolve(filePath);
  const imageBuffer = fs.readFileSync(absolutePath);
  const base64 = imageBuffer.toString("base64");

  const prompt = `
Eres un generador de exámenes para estudiantes de colegio.
Analiza el contenido textual de esta imagen (por ejemplo una página de libro o ejercicio)
y genera ${totalQuestions} preguntas de opción múltiple.
Devuelve SOLO un JSON válido con este formato exacto:

[
  {
    "questionText": "texto de la pregunta",
    "options": [
      { "letter": "A", "text": "opción A", "isCorrect": true },
      { "letter": "B", "text": "opción B", "isCorrect": false },
      { "letter": "C", "text": "opción C", "isCorrect": false },
      { "letter": "D", "text": "opción D", "isCorrect": false }
    ],
    "difficulty": "easy" | "medium" | "hard"
  }
]

No incluyas explicación ni texto fuera del JSON.
`;

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64,
            },
          },
        ],
      },
    ],
  });

  const text = result.response.text();

  let questions;
  try {
    questions = JSON.parse(text);
  } catch (err) {
    console.warn("[Gemini][Image] Error al hacer JSON.parse directo. Intentando extraer JSON de la respuesta cruda.");
    console.log("[Gemini][Image] Respuesta cruda:", text);

    // Intentar extraer el primer bloque que parezca un array JSON
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        questions = JSON.parse(match[0]);
      } catch (innerErr) {
        console.error("[Gemini][Image] Error parseando bloque extraído como JSON:", innerErr, "Bloque:", match[0]);
        questions = null;
      }
    } else {
      console.error("[Gemini][Image] No se encontró ningún bloque JSON en la respuesta:", text);
      questions = null;
    }
  }

  // Si seguimos sin un array válido, usar preguntas simuladas como fallback
  if (!Array.isArray(questions)) {
    console.warn("[Gemini][Image] Usando preguntas simuladas como fallback para imagen.");
    questions = Array.from({ length: totalQuestions }).map((_, idx) => ({
      questionText: `Pregunta simulada ${idx + 1} basada en la imagen (fallback).`,
      options: [
        { letter: "A", text: "Opción A", isCorrect: idx % 4 === 0 },
        { letter: "B", text: "Opción B", isCorrect: idx % 4 === 1 },
        { letter: "C", text: "Opción C", isCorrect: idx % 4 === 2 },
        { letter: "D", text: "Opción D", isCorrect: idx % 4 === 3 },
      ],
      difficulty: "medium",
    }));
  }

  return questions.slice(0, totalQuestions);
}

module.exports = {
  generateQuestionsFromText,
  generateQuestionsFromImage,
};
