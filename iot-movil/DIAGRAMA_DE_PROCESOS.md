## Diagrama resumido (Inicio → Fin)

```mermaid
flowchart TD
  %% Nodos principales
  INICIO([Inicio])
  FIN([Fin])

  subgraph IOT[Dispositivos IoT]
    SW[SW-18010 (Vibración)]
    MQ[MQ-135 (Calidad de Aire)]
  end

  GW[Gateway/Microcontrolador]
  API[API Backend]
  DB[(Base de Datos)]
  APP[App Móvil]
  USER[Usuario]

  %% Flujo IoT → API → BD
  INICIO --> IOT
  SW --> GW
  MQ --> GW
  GW -- Envío lecturas (HTTP/MQTT) --> API
  API -- Persistencia --> DB

  %% Autenticación y consulta desde la app
  USER --> APP
  APP -- Login/Token --> API
  API -- Verifica/Emite Token --> DB
  API --> APP
  APP -- Consultas (últimas lecturas, historial) --> API
  API -- Lecturas --> DB
  DB --> API
  API --> APP
  APP --> USER

  %% Cierre
  USER --> FIN

  %% Estilos
  classDef device fill:#E0F7FA,stroke:#0097A7,color:#004D40
  classDef compute fill:#EDE7F6,stroke:#5E35B1,color:#311B92
  classDef storage fill:#FFF3E0,stroke:#F57C00,color:#E65100
  classDef app fill:#E8F5E9,stroke:#43A047,color:#1B5E20

  class SW,MQ device
  class GW,API compute
  class DB storage
  class APP,USER app
```

Este diagrama resume el flujo completo: los sensores envían lecturas al backend para ser almacenadas en la base de datos; la app móvil se autentica, consulta datos (últimas lecturas e historial) y presenta el dashboard al usuario.


