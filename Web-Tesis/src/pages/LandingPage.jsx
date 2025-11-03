import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  ArrowRight,
  Sparkles,
  BookOpen,
  Brain,
  Calculator,
  Shapes,
  Type,
  Star
} from 'lucide-react'

const LandingPage = () => {
  // Elementos educativos para el fondo interactivo
  const educationalElements = [
    { type: 'math', content: '2+3=5', icon: <Calculator className="w-6 h-6" /> },
    { type: 'math', content: '7-4=3', icon: <Calculator className="w-6 h-6" /> },
    { type: 'math', content: '6×2=12', icon: <Calculator className="w-6 h-6" /> },
    { type: 'letter', content: 'A', icon: <Type className="w-6 h-6" /> },
    { type: 'letter', content: 'B', icon: <Type className="w-6 h-6" /> },
    { type: 'letter', content: 'C', icon: <Type className="w-6 h-6" /> },
    { type: 'shape', content: '○', icon: <Shapes className="w-6 h-6" /> },
    { type: 'shape', content: '△', icon: <Shapes className="w-6 h-6" /> },
    { type: 'shape', content: '□', icon: <Shapes className="w-6 h-6" /> },
    { type: 'book', content: '📚', icon: <BookOpen className="w-6 h-6" /> },
    { type: 'book', content: '📖', icon: <BookOpen className="w-6 h-6" /> },
    { type: 'brain', content: '🧠', icon: <Brain className="w-6 h-6" /> }
  ]

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4 sm:p-6">
        <div className="w-full flex justify-start items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <img 
              src="/escudo.png" 
              alt="Escudo Colegio San Pedro" 
              className="w-8 h-8 sm:w-12 sm:h-12 object-contain"
            />
            <div>
              <h1 className="text-sm sm:text-xl font-bold text-white">Colegio San Pedro</h1>
              <p className="text-xs sm:text-sm text-white/80 hidden sm:block">Asistente de Lectura IA</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section con fondo educativo interactivo */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-purple-900 to-indigo-900">
        {/* Fondo educativo interactivo */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Elementos educativos flotantes */}
          {educationalElements.map((element, i) => (
            <motion.div
              key={i}
              className="absolute flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full border-2 border-white/30"
              animate={{
                x: [0, Math.random() * 200 - 100, 0],
                y: [0, Math.random() * 200 - 100, 0],
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 15 + i * 2,
                repeat: Infinity,
                delay: i * 0.8,
                ease: "easeInOut"
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            >
              <div className="text-center">
                <div className="text-white text-lg font-bold mb-1">
                  {element.content}
                </div>
                <div className="text-white/80">
                  {element.icon}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Partículas de estrellas */}
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={`star-${i}`}
              className="absolute text-yellow-300"
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 1, 0.3],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            >
              <Star className="w-3 h-3" />
            </motion.div>
          ))}

          {/* Formas geométricas flotantes */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={`shape-${i}`}
              className="absolute border-2 border-white/30"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 8 + i,
                repeat: Infinity,
                delay: i * 0.5,
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${20 + Math.random() * 40}px`,
                height: `${20 + Math.random() * 40}px`,
                borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '0%' : '20%',
              }}
            />
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center pt-20 sm:pt-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
              <span className="text-white font-medium text-sm sm:text-base">Colegio San Pedro - Educación Primaria con IA</span>
            </motion.div>

            <motion.h1 
              className="text-3xl sm:text-5xl md:text-7xl font-bold text-white mb-4 sm:mb-6 text-shadow"
              animate={{
                textShadow: [
                  "0 0 20px rgba(255,255,255,0.5)",
                  "0 0 30px rgba(255,255,255,0.8)",
                  "0 0 20px rgba(255,255,255,0.5)"
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Asistente de
              <span className="block text-white">
                Lectura IA
              </span>
            </motion.h1>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8"
            >
              <span className="text-white font-medium text-base sm:text-lg">
                Plataforma educativa innovadora que utiliza inteligencia artificial para crear exámenes personalizados de comprensión lectora.
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center"
            >
              <Link
                to="/register"
                className="group bg-white text-primary-600 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-primary-50 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full sm:w-auto justify-center"
              >
                Crear Cuenta
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="group border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-white hover:text-primary-600 transition-all duration-300 flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                Iniciar Sesión
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                <img 
                  src="/escudo.png" 
                  alt="Escudo Colegio San Pedro" 
                  className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                />
                Colegio San Pedro
              </h3>
              <p className="text-gray-400 text-sm sm:text-base">
                Revolucionando la educación con inteligencia artificial para mejorar la comprensión lectora de nuestros estudiantes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Plataforma</h4>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                <li><a href="#" className="hover:text-white transition-colors">Estudiantes</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Docentes</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Exámenes</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Progreso</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Recursos</h4>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                <li><a href="#" className="hover:text-white transition-colors">Documentación</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tutoriales</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Soporte</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Contacto</h4>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                <li>Email: info@colegiosanpedro.edu.pe</li>
                <li>Teléfono: +51 (01) 123-4567</li>
                <li>Dirección: Lima, Perú</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-400 text-sm sm:text-base">
            <p>&copy; 2024 Colegio San Pedro - Asistente de Lectura IA. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
