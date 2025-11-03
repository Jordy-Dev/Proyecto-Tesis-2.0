# 🗄️ Diagrama de Base de Datos - Colegio San Pedro
## Asistente de Lectura con IA

---

## 📊 Tablas del Sistema

### 1. **users** (Usuarios)
Almacena información de estudiantes y docentes.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identificador único del usuario |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Correo electrónico |
| `password` | VARCHAR(255) | NOT NULL | Contraseña encriptada |
| `name` | VARCHAR(255) | NOT NULL | Nombre completo |
| `user_type` | ENUM('student', 'teacher') | NOT NULL | Tipo de usuario |
| `grade` | ENUM('1er Grado', '2do Grado', '3er Grado', '4to Grado', '5to Grado', '6to Grado') | NOT NULL | Grado del estudiante o que enseña el docente |
| `section` | ENUM('A', 'B') | NULL | Sección (solo para estudiantes) |
| `avatar_url` | VARCHAR(500) | NULL | URL del avatar |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Última actualización |

**Índices:**
- `idx_email` en `email`
- `idx_user_type` en `user_type`
- `idx_grade_section` en `(grade, section)`

---

### 2. **documents** (Documentos)
Documentos subidos por estudiantes.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identificador único |
| `user_id` | BIGINT | FOREIGN KEY (users.id), NOT NULL | ID del estudiante |
| `file_name` | VARCHAR(255) | NOT NULL | Nombre del archivo |
| `file_path` | VARCHAR(500) | NOT NULL | Ruta de almacenamiento |
| `file_type` | ENUM('pdf', 'docx', 'txt', 'image') | NOT NULL | Tipo de archivo |
| `file_size` | BIGINT | NOT NULL | Tamaño en bytes |
| `content_text` | TEXT | NULL | Contenido extraído |
| `uploaded_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de carga |

**Índices:**
- `idx_user_id` en `user_id`
- `idx_uploaded_at` en `uploaded_at`

---

### 3. **exams** (Exámenes)
Exámenes generados por IA.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identificador único |
| `document_id` | BIGINT | FOREIGN KEY (documents.id), NOT NULL | ID del documento origen |
| `user_id` | BIGINT | FOREIGN KEY (users.id), NOT NULL | ID del estudiante |
| `title` | VARCHAR(255) | NOT NULL | Título del examen |
| `total_questions` | INT | NOT NULL, DEFAULT 10 | Total de preguntas |
| `status` | ENUM('pending', 'in_progress', 'completed') | DEFAULT 'pending' | Estado del examen |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |

**Índices:**
- `idx_user_id` en `user_id`
- `idx_document_id` en `document_id`
- `idx_status` en `status`

---

### 4. **questions** (Preguntas)
Preguntas de cada examen.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identificador único |
| `exam_id` | BIGINT | FOREIGN KEY (exams.id) ON DELETE CASCADE, NOT NULL | ID del examen |
| `question_number` | INT | NOT NULL | Número de orden |
| `question_text` | TEXT | NOT NULL | Texto de la pregunta |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |

**Índices:**
- `idx_exam_id` en `exam_id`

---

### 5. **question_options** (Opciones de Respuesta)
Opciones para preguntas de opción múltiple.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identificador único |
| `question_id` | BIGINT | FOREIGN KEY (questions.id) ON DELETE CASCADE, NOT NULL | ID de la pregunta |
| `option_letter` | CHAR(1) | NOT NULL | Letra de la opción (A, B, C, D) |
| `option_text` | TEXT | NOT NULL | Texto de la opción |
| `is_correct` | BOOLEAN | NOT NULL, DEFAULT FALSE | Si es correcta |
| `order_number` | INT | NOT NULL | Orden de presentación |

**Índices:**
- `idx_question_id` en `question_id`
- `unique_question_option` en `(question_id, option_letter)` UNIQUE

---

### 6. **student_answers** (Respuestas de Estudiantes)
Respuestas de estudiantes a preguntas.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identificador único |
| `exam_id` | BIGINT | FOREIGN KEY (exams.id) ON DELETE CASCADE, NOT NULL | ID del examen |
| `question_id` | BIGINT | FOREIGN KEY (questions.id) ON DELETE CASCADE, NOT NULL | ID de la pregunta |
| `user_id` | BIGINT | FOREIGN KEY (users.id), NOT NULL | ID del estudiante |
| `selected_option` | CHAR(1) | NULL | Opción seleccionada |
| `is_correct` | BOOLEAN | NULL | Si es correcta |
| `answered_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de respuesta |

**Índices:**
- `idx_exam_id` en `exam_id`
- `idx_user_id` en `user_id`
- `unique_exam_user_question` en `(exam_id, user_id, question_id)` UNIQUE

---

### 7. **exam_results** (Resultados de Exámenes)
Resultado final de cada examen.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identificador único |
| `exam_id` | BIGINT | FOREIGN KEY (exams.id) ON DELETE CASCADE, NOT NULL | ID del examen |
| `user_id` | BIGINT | FOREIGN KEY (users.id), NOT NULL | ID del estudiante |
| `total_questions` | INT | NOT NULL | Total de preguntas |
| `correct_answers` | INT | NOT NULL, DEFAULT 0 | Respuestas correctas |
| `incorrect_answers` | INT | NOT NULL, DEFAULT 0 | Respuestas incorrectas |
| `percentage_score` | DECIMAL(5,2) | NOT NULL, DEFAULT 0.00 | Porcentaje de acierto |
| `passed` | BOOLEAN | NOT NULL, DEFAULT FALSE | Si aprobó |
| `completed_at` | TIMESTAMP | NULL | Fecha de finalización |

**Índices:**
- `idx_exam_id` en `exam_id`
- `idx_user_id` en `user_id`
- `idx_completed_at` en `completed_at`
- `unique_exam_user` en `(exam_id, user_id)` UNIQUE

---

### 8. **student_progress** (Progreso del Estudiante)
Seguimiento del progreso de cada estudiante.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identificador único |
| `user_id` | BIGINT | FOREIGN KEY (users.id), UNIQUE, NOT NULL | ID del estudiante |
| `total_exams_taken` | INT | NOT NULL, DEFAULT 0 | Total de exámenes realizados |
| `total_exams_passed` | INT | NOT NULL, DEFAULT 0 | Total aprobados |
| `average_score` | DECIMAL(5,2) | DEFAULT 0.00 | Promedio general |
| `highest_score` | DECIMAL(5,2) | DEFAULT 0.00 | Calificación más alta |
| `current_streak` | INT | DEFAULT 0 | Racha actual de aprobados |
| `last_activity_at` | TIMESTAMP | NULL | Última actividad |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Actualización |

**Índices:**
- `idx_user_id` en `user_id` UNIQUE
- `idx_average_score` en `average_score`

---

## 🔗 Diagrama de Relaciones (ERD)

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   users     │◄────────│  documents   │────────►│   exams     │
│             │  1:N    │              │  1:1    │             │
│ id (PK)     │         │ id (PK)      │         │ id (PK)     │
│ email       │         │ user_id (FK) │         │ document_id │
│ name        │         │ file_name    │         │ user_id (FK)│
│ user_type   │         │ file_path    │         │ title       │
│ grade       │         │ file_type    │         │ status      │
│ section     │         └──────────────┘         └──────┬──────┘
└──────┬──────┘                                         │
       │                                                │ 1:N
       │ 1:N                                            │
       │                                         ┌──────▼──────┐
       │                                         │  questions  │
       │                                         │             │
       │                                         │ id (PK)     │
       │                                         │ exam_id(FK) │
       │                                         │ question_   │
       │                                         │    text     │
       │                                         └──────┬──────┘
       │                                                │ 1:N
       │                                                │
       │                                   ┌────────────▼──────────┐
       │                                   │  question_options     │
       │                                   │                       │
       │                                   │  id (PK)              │
       │                                   │  question_id (FK)     │
       │                                   │  option_text          │
       │                                   │  is_correct           │
       │                                   └───────────────────────┘
       │
       │ 1:N
       │
┌──────▼──────────┐           ┌─────────────────┐         ┌─────────────────┐
│student_answers  │           │ exam_results    │         │student_progress │
│                 │           │                 │         │                 │
│ id (PK)         │           │ id (PK)         │         │ id (PK)         │
│ exam_id (FK)    │           │ exam_id (FK)    │         │ user_id (FK)    │
│ question_id(FK) │           │ user_id (FK)    │         │ total_exams     │
│ user_id (FK)    │           │ percentage_score│         │ average_score   │
│ selected_option │           │ passed          │         │ current_streak  │
│ is_correct      │           │ completed_at    │         └─────────────────┘
└─────────────────┘           └─────────────────┘
```

---

## 🔑 Relaciones Principales

1. **users → documents** (1:N)
   - Un estudiante puede subir muchos documentos

2. **documents → exams** (1:1)
   - Cada documento genera un examen

3. **users → exams** (1:N)
   - Un estudiante puede tener muchos exámenes

4. **exams → questions** (1:N)
   - Un examen tiene 10 preguntas

5. **questions → question_options** (1:N)
   - Cada pregunta tiene 4 opciones (A, B, C, D)

6. **users → student_answers** (1:N)
   - Un estudiante responde muchas preguntas

7. **exams → exam_results** (1:1)
   - Cada examen completado tiene un resultado

8. **users → student_progress** (1:1)
   - Cada estudiante tiene un registro de progreso

9. **Docentes → Estudiantes** (1:N por grade)
   - Un docente ve todos los estudiantes de su grado asignado (ambas secciones A y B)

---

## 📝 Reglas de Negocio

### Estudiantes:
- Seleccionan grado (1er a 6to) y sección (A o B)
- Pueden subir documentos (PDF, DOCX, TXT, imágenes)
- Cada documento genera automáticamente un examen de 10 preguntas
- Solo ven sus propios exámenes y resultados

### Docentes:
- Seleccionan el grado que enseñan (1er a 6to)
- Enseñan automáticamente a ambas secciones (A y B) de su grado
- Pueden filtrar por sección para ver estudiantes específicos
- Ven todos los estudiantes y sus resultados de su grado asignado

### Exámenes:
- Se generan con IA (Ollama) a partir del documento
- 10 preguntas de opción múltiple
- 4 opciones por pregunta (A, B, C, D)
- Puntaje de aprobación: 70%
- Se calcula automáticamente al completar

### Progreso:
- Se actualiza automáticamente después de cada examen
- Racha se incrementa con cada examen aprobado consecutivo
- Racha se reinicia al reprobar un examen
- Promedio se calcula solo con exámenes completados

---

## 🚀 Notas de Implementación

**Motor de Base de Datos**: MySQL 8.0+ o PostgreSQL 14+

**Encriptación**: 
- Contraseñas con bcrypt
- Datos sensibles en tránsito con HTTPS

**Almacenamiento de Archivos**:
- Documentos en sistema de archivos o S3
- Máximo 10MB por archivo

**Modelo de IA**:
- Ollama (llama2, mistral)
- Fallback con exámenes predefinidos si IA no disponible

---

**Versión**: 1.0.0  
**Última Actualización**: 2024  
**Desarrollado para**: Colegio San Pedro
