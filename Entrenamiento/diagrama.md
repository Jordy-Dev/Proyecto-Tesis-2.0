### Diagrama de proceso — Sistema de participación (versión breve con BD)

```mermaid
flowchart LR
    S((Inicio)) --> U[Usuario]
    U --> UI[Componente de Participación]
    UI --> D{¿Participación detectada?}
    D -- No --> UI
    D -- Sí --> V[Validar (sesión, anti-spam)]
    V -- Inválido --> UI
    V -- Válido --> Q[(Cola opcional)]
    Q --> DB[Guardar conteo en Base de Datos]
    DB --> OK[Actualizar UI/contador]
    DB -. fallo/reintentos .- Q
    OK --> REP[Dashboard / Reportes]
    REP --- DB
    REP --> F((Fin))

    style DB fill:#e8f1ff,stroke:#4a90e2,stroke-width:2px
```
