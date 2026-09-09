"""
evacuapp_features.py
====================
Definición ÚNICA del vector de características del modelo de confiabilidad
de reportes de EvacuApp.

Este archivo lo usan:
  * entrenar_modelo_final.py  (entrenamiento y exportación)
  * ml_service/main.py        (microservicio FastAPI para el backend NestJS)

La clase Kotlin ReportValidityModel.kt replica exactamente este orden y
esta codificación. Si cambias algo aquí, cambia también el Kotlin y
regenera metadata.json.
"""
from __future__ import annotations

import numpy as np

# Variables numéricas (en este orden)
NUMERICAS = [
    "alpha",
    "beta",
    "confianza_beta",
    "reportes_cercanos",
    "usuarios_distintos",
    "min_desde_primer_reporte",
    "antiguedad_min",
    "reputacion_usuario",
    "usuario_nuevo",
    "tiene_foto",
    "severidad",
    "dist_zona_amenaza_m",
    "precision_gps_m",
    "hora",
]

# Categorías fijas (one-hot manual, en este orden). Cualquier valor
# desconocido se codifica como todo ceros (equivale a "sin categoría").
TIPOS_INCIDENTE = ["BLOQUEO_VIAL", "INCENDIO", "INUNDACION", "DERRUMBE",
                   "ACCIDENTE", "RUTA_INACCESIBLE", "OTRO"]
TIPOS_EMERGENCIA = ["SISMO", "INCENDIO", "INUNDACION", "TSUNAMI", "NINGUNA"]

FEATURE_NAMES = (
    NUMERICAS
    + [f"tipo_incidente={t}" for t in TIPOS_INCIDENTE]
    + [f"tipo_emergencia={t}" for t in TIPOS_EMERGENCIA]
)
N_FEATURES = len(FEATURE_NAMES)  # 14 + 7 + 5 = 26


def reporte_a_vector(r: dict) -> np.ndarray:
    """Convierte un reporte (dict con las claves de NUMERICAS + tipo_incidente
    + tipo_emergencia) en un vector float32 de largo N_FEATURES.

    confianza_beta se recalcula siempre como alpha / (alpha + beta) para
    garantizar coherencia con el consenso Beta de la app.
    """
    alpha = float(r["alpha"])
    beta = float(r["beta"])
    conf = alpha / (alpha + beta) if (alpha + beta) > 0 else 0.5

    v = np.zeros(N_FEATURES, dtype=np.float32)
    for i, nombre in enumerate(NUMERICAS):
        if nombre == "confianza_beta":
            v[i] = conf
        else:
            v[i] = float(r[nombre])

    base = len(NUMERICAS)
    ti = str(r.get("tipo_incidente", "")).upper()
    if ti in TIPOS_INCIDENTE:
        v[base + TIPOS_INCIDENTE.index(ti)] = 1.0

    base += len(TIPOS_INCIDENTE)
    te = str(r.get("tipo_emergencia", "")).upper()
    if te in TIPOS_EMERGENCIA:
        v[base + TIPOS_EMERGENCIA.index(te)] = 1.0
    return v


def dataframe_a_matriz(df) -> np.ndarray:
    """Vectoriza un DataFrame completo (filas = reportes)."""
    filas = df.to_dict(orient="records")
    return np.vstack([reporte_a_vector(r) for r in filas])
