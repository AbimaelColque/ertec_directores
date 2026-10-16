# ERTEC · Simulacro de Institucionalización 2027-2029
Convocatoria Pública N° 0001/2026 (Ministerio de Educación)

## Cómo agregar tus preguntas (un JSON por bibliografía)
Cada bibliografía tiene su propio archivo en `data/bib/`:

    data/bib/neurociencia.json · ley_070.json · ds_514.json · cpe.json · itt_rm_350.json · ...

Cada archivo es una lista de preguntas. Copia el formato de `data/bib/_plantilla.json`:

    [
      {
        "question": "Enunciado de la pregunta",
        "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
        "answer": 1,                      // posición de la correcta: 0=A, 1=B, 2=C, 3=D
        "difficulty": "media",            // facil | media | dificil
        "fuente": "Nombre de la bibliografía",
        "explicacion": "(opcional) por qué es la correcta"
      }
    ]

Guarda, recarga la app y listo: los contadores y los simulacros se actualizan solos.
Los archivos con preguntas mal formadas se ignoran (no rompen la app).

## Agregar una bibliografía nueva
1. Crea `data/bib/mi_bibliografia.json` con `[]`.
2. En `data/config.json`, dentro de `"bibliografias"`, agrega:
   `{"id":"mi_bibliografia","grupo":"normativa","icono":"📘","nombre":"Mi bibliografía","autor":"…","color":"#34D399","archivo":"data/bib/mi_bibliografia.json","survey":false}`
   (grupos: pedagogia, normativa, administrativa, itt_normativa, itt_pedagogia, encuesta)

## Distribución del examen (REFERENCIAL)
La convocatoria no publica contenido, nº de preguntas ni nota mínima del examen; saldrán en el
Reglamento (Resolución Ministerial). Cuando se publique, edita en `data/config.json`:
`perfiles.general` / `perfiles.itt` → `preguntas`, `minutos`, `aprobacion`, `pesos` por área.

## Cargos, costos y cronograma
También están en `data/config.json` (`cargos`, `cronograma`, `familias`).

## Probar en tu PC
Abre una terminal en esta carpeta y ejecuta `python3 -m http.server 8000`, luego entra a http://localhost:8000
(No abras los HTML con doble clic: el navegador bloquea la lectura de los JSON.)
Contraseña de acceso: está en `login.html` (constante PASSWORD).
