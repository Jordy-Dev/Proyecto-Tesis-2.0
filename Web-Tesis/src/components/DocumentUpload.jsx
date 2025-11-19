import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { 
  Upload, 
  FileText, 
  Image, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle,
  Brain,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import apiService from '../services/api'

const DocumentUpload = ({ onDocumentProcessed }) => {
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0]
    if (file) {
      setUploadedFile(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) {
      return <Image className="w-8 h-8 text-blue-500" />
    } else if (fileType === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-500" />
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <FileText className="w-8 h-8 text-blue-600" />
    } else {
      return <File className="w-8 h-8 text-gray-500" />
    }
  }

  const getFileType = (fileType) => {
    if (fileType.startsWith('image/')) {
      return 'image'
    } else if (fileType === 'application/pdf') {
      return 'pdf'
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return 'docx'
    } else if (fileType === 'text/plain') {
      return 'txt'
    }
    return 'unknown'
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleProcessDocument = async () => {
    if (!uploadedFile) return

    setIsProcessing(true)
    setProcessingStep('Subiendo documento...')

    try {
      // Subir documento a la API
      const fileType = getFileType(uploadedFile.type)
      const response = await apiService.uploadDocument(
        uploadedFile,
        uploadedFile.name,
        fileType,
        uploadedFile.size
      )

      if (response.success) {
        setProcessingStep('Procesando con IA...')
        
        // Procesar documento con IA (asíncrono)
        const processResponse = await apiService.processDocument(response.data.document.id)
        
        if (processResponse.success) {
          setProcessingStep('Esperando análisis completo...')
          
          // Esperar a que el documento esté completamente procesado
          const documentId = response.data.document.id
          let documentStatus = 'processing'
          let attempts = 0
          const maxAttempts = 40 // Máximo 40 intentos (reducido para evitar rate limit)
          let baseDelay = 10000 // Empezar con 10 segundos
          
          // Polling con backoff exponencial para verificar el estado
          while (documentStatus === 'processing' && attempts < maxAttempts) {
            // Backoff exponencial: 10s, 15s, 20s, 25s...
            const delay = baseDelay + (attempts * 5000)
            await new Promise(resolve => setTimeout(resolve, delay))
            
            try {
              const statusResponse = await apiService.checkDocumentStatus(documentId)
              documentStatus = statusResponse.status
              
              if (documentStatus === 'analyzed') {
                setProcessingStep('¡Documento procesado exitosamente!')
                toast.success('¡Documento procesado exitosamente!')
                
                // Notificar al componente padre con el documento actualizado
                if (onDocumentProcessed) {
                  onDocumentProcessed(statusResponse)
                }
                
                // Limpiar archivo
                setUploadedFile(null)
                break
              } else if (documentStatus === 'error') {
                throw new Error(statusResponse.errorMessage || 'Error procesando el documento')
              }
            } catch (error) {
              // Si es error 429 (rate limit), esperar más tiempo antes de reintentar
              if (error.message?.includes('429') || error.message?.includes('Demasiadas solicitudes')) {
                console.warn('Rate limit alcanzado, esperando más tiempo...')
                await new Promise(resolve => setTimeout(resolve, 30000)) // Esperar 30 segundos adicionales
                continue
              }
              console.error('Error verificando estado:', error)
              // Continuar intentando
            }
            
            attempts++
          }
          
          if (documentStatus === 'processing') {
            throw new Error('El procesamiento está tomando más tiempo del esperado. El examen se creará cuando el documento esté listo.')
          } else if (documentStatus !== 'analyzed') {
            throw new Error('Error procesando documento')
          }
        } else {
          throw new Error(processResponse.message || 'Error procesando documento')
        }
      } else {
        throw new Error(response.message || 'Error subiendo documento')
      }
    } catch (error) {
      console.error('Error procesando documento:', error)
      toast.error(error.message || 'Error procesando documento')
      setProcessingStep('Error procesando documento')
    } finally {
      setIsProcessing(false)
      setTimeout(() => {
        setProcessingStep('')
      }, 3000)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    setProcessingStep('')
  }

  return (
    <div className="space-y-6">
      {/* Área de subida */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-primary-600" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra tu documento aquí'}
            </h3>
            <p className="text-gray-600 mb-4">
              O haz clic para seleccionar un archivo
            </p>
            <p className="text-sm text-gray-500">
              Formatos soportados: PDF, DOCX, TXT, PNG, JPG (máx. 10MB)
            </p>
          </div>
        </div>
      </motion.div>

      {/* Archivo subido */}
      {uploadedFile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getFileIcon(uploadedFile.type)}
              <div>
                <h4 className="font-semibold text-gray-800">{uploadedFile.name}</h4>
                <p className="text-sm text-gray-500">
                  {formatFileSize(uploadedFile.size)} • {getFileType(uploadedFile.type).toUpperCase()}
                </p>
              </div>
            </div>
            
            {!isProcessing && (
              <button
                onClick={removeFile}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Botón de procesar */}
      {uploadedFile && !isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <button
            onClick={handleProcessDocument}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-primary-600 hover:to-secondary-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Brain className="w-5 h-5" />
            Procesar con IA
          </button>
        </motion.div>
      )}

      {/* Estado de procesamiento */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6 border border-primary-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Procesando documento</h4>
              <p className="text-sm text-gray-600">{processingStep}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Información sobre el procesamiento */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-blue-50 rounded-xl p-6 border border-blue-200"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">¿Cómo funciona el procesamiento?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• La IA analiza el contenido de tu documento</li>
              <li>• Genera automáticamente 10 preguntas de comprensión lectora</li>
              <li>• Crea opciones de respuesta múltiple</li>
              <li>• Establece el nivel de dificultad apropiado</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default DocumentUpload