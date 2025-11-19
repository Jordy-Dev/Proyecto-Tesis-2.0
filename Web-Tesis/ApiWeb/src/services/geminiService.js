const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Usar gemini-2.5-flash según la documentación oficial de Google
// Este modelo soporta texto, imágenes, video y audio (multimodal)
const getModel = () => genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

/**
 * Función helper para reintentos con backoff exponencial
 */
const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 1000) => {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Si es error 503 (sobrecarga) o 429 (rate limit), reintentar
      const isRetryable = error.message?.includes('503') || 
                         error.message?.includes('429') ||
                         error.message?.includes('overloaded') ||
                         error.message?.includes('quota');
      
      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }
      
      // Backoff exponencial: 1s, 2s, 4s
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`Reintentando en ${delay}ms (intento ${attempt + 1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

/**
 * Extrae texto de un archivo según su tipo
 */
const extractTextFromFile = async (filePath, fileType) => {
  try {
    const fileBuffer = await fs.readFile(filePath);

    switch (fileType) {
      case 'pdf':
        const pdfData = await pdfParse(fileBuffer);
        return pdfData.text;

      case 'docx':
        const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
        return docxResult.value;

      case 'txt':
        return fileBuffer.toString('utf-8');

      case 'image':
        // Para imágenes, retornamos null ya que Gemini puede procesarlas directamente
        return null;

      default:
        throw new Error(`Tipo de archivo no soportado: ${fileType}`);
    }
  } catch (error) {
    console.error('Error extrayendo texto del archivo:', error);
    throw new Error(`Error extrayendo texto: ${error.message}`);
  }
};

/**
 * Procesa un documento y extrae su contenido usando Gemini
 */
const processDocumentWithGemini = async (filePath, fileType) => {
  try {
    if (fileType === 'image') {
      // Para imágenes, usar procesamiento de vision
      const fileBuffer = await fs.readFile(filePath);
      const imageBase64 = fileBuffer.toString('base64');
      
      const prompt = `Por favor, extrae todo el texto visible de esta imagen. 
      Si contiene contenido educativo, texto de lectura o documentos académicos, 
      incluye todo el texto de forma clara y estructurada.
      
      Responde SOLO con el texto extraído, sin comentarios adicionales.`;

      // Usar gemini-2.5-flash para procesar imágenes (multimodal)
      // Formato según documentación: pasar imagen como inlineData junto con el prompt
      const model = getModel();
      const result = await retryWithBackoff(async () => {
        return await model.generateContent([
          {
            inlineData: {
              mimeType: getImageMimeType(filePath),
              data: imageBase64
            }
          },
          prompt
        ]);
      });

      const response = await result.response;
      return response.text();
    } else {
      // Para documentos de texto, extraer primero el texto
      const extractedText = await extractTextFromFile(filePath, fileType);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No se pudo extraer texto del documento');
      }

      const prompt = `Analiza el siguiente documento y extrae su contenido principal.
      
      Por favor:
      1. Resumen el contenido principal del documento
      2. Identifica los temas y conceptos clave
      3. Extrae información importante de forma estructurada
      
      Contenido del documento:
      ${extractedText.substring(0, 30000)}`; // Limitar a 30k caracteres

      // Usar gemini-2.5-flash para analizar documentos de texto
      const model = getModel();
      const result = await retryWithBackoff(async () => {
        return await model.generateContent(prompt);
      });
      const response = await result.response;
      
      // Retornar tanto el texto original como el análisis
      return {
        originalText: extractedText,
        analyzedContent: response.text()
      };
    }
  } catch (error) {
    console.error('Error procesando documento con Gemini:', error);
    throw new Error(`Error procesando documento: ${error.message}`);
  }
};

/**
 * Genera preguntas de opción múltiple usando Gemini basado en el contenido del documento
 */
const generateQuestionsWithGemini = async (contentText, totalQuestions = 10) => {
  try {
    const prompt = `Eres un profesor experto en educación primaria. 
    Basándote en el siguiente contenido educativo, genera exactamente ${totalQuestions} preguntas de opción múltiple.
    
    Cada pregunta debe:
    1. Tener 4 opciones (A, B, C, D)
    2. Solo una respuesta correcta
    3. Ser apropiada para estudiantes de primaria (4to, 5to o 6to grado)
    4. Evaluar comprensión lectora y entendimiento del contenido
    5. Ser clara y específica
    6. Incluir una explicación breve de por qué la respuesta es correcta
    
    Responde ÚNICAMENTE en formato JSON válido, sin texto adicional antes o después. 
    El formato debe ser exactamente así:
    
    {
      "questions": [
        {
          "questionNumber": 1,
          "questionText": "¿Cuál es la pregunta?",
          "options": [
            {"letter": "A", "text": "Opción A", "isCorrect": true},
            {"letter": "B", "text": "Opción B", "isCorrect": false},
            {"letter": "C", "text": "Opción C", "isCorrect": false},
            {"letter": "D", "text": "Opción D", "isCorrect": false}
          ],
          "explanation": "Breve explicación de por qué la respuesta correcta es correcta",
          "difficulty": "easy|medium|hard"
        }
      ]
    }
    
    Contenido del documento:
    ${contentText.substring(0, 30000)}`; // Limitar a 30k caracteres

    // Usar gemini-2.5-flash para generar preguntas del examen
    const model = getModel();
    const result = await retryWithBackoff(async () => {
      return await model.generateContent(prompt);
    });
    const response = await result.response;
    const responseText = response.text();

    // Limpiar el texto de respuesta (puede incluir markdown code blocks)
    let cleanText = responseText.trim();
    
    // Remover markdown code blocks si existen
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    // Parsear JSON
    const parsedResponse = JSON.parse(cleanText);

    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      throw new Error('Formato de respuesta inválido: no se encontraron preguntas');
    }

    return parsedResponse.questions;
  } catch (error) {
    console.error('Error generando preguntas con Gemini:', error);
    throw new Error(`Error generando preguntas: ${error.message}`);
  }
};

/**
 * Obtiene el tipo MIME de una imagen basado en su extensión
 */
const getImageMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp'
  };
  return mimeTypes[ext] || 'image/jpeg';
};

module.exports = {
  processDocumentWithGemini,
  generateQuestionsWithGemini,
  extractTextFromFile
};

