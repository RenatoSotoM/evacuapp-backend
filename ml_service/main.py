"""
Microservicio de confiabilidad de reportes - EvacuApp
=====================================================
FastAPI + scikit-learn. Lo consulta el backend NestJS cada vez que se crea o
actualiza un reporte (o al consolidar el consenso de un incidente).

Ejecutar en local:
    pip install -r requirements.txt
    uvicorn main:app --host 0.0.0.0 --port 8001

Docs interactivas: http://localhost:8001/docs
"""
from __future__ import annotations

import json
import os
from typing import List, Literal

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from evacuapp_features import reporte_a_vector, TIPOS_INCIDENTE, TIPOS_EMERGENCIA

RUTA_MODELO = os.getenv("RUTA_MODELO", "modelo_confiabilidad.joblib")
RUTA_META = os.getenv("RUTA_META", "metadata.json")

modelo = joblib.load(RUTA_MODELO)
with open(RUTA_META, encoding="utf-8") as f:
    META = json.load(f)
UMBRAL_VALIDO = float(META["umbrales"]["valido"])
UMBRAL_PROBABLE = float(META["umbrales"]["probable"])

app = FastAPI(title="EvacuApp ML - Confiabilidad de reportes", version=META["version"])


class ReporteIn(BaseModel):
    alpha: float = Field(..., ge=0, description="Confirmaciones + 1 (prior Beta)")
    beta: float = Field(..., ge=0, description="Rechazos + 1 (prior Beta)")
    reportes_cercanos: int = Field(..., ge=0)
    usuarios_distintos: int = Field(..., ge=0)
    min_desde_primer_reporte: float = Field(..., ge=0)
    antiguedad_min: float = Field(..., ge=0)
    reputacion_usuario: float = Field(..., ge=0, le=1)
    usuario_nuevo: int = Field(..., ge=0, le=1)
    tiene_foto: int = Field(..., ge=0, le=1)
    severidad: int = Field(..., ge=1, le=3)
    dist_zona_amenaza_m: float = Field(..., ge=0)
    precision_gps_m: float = Field(..., ge=0)
    hora: int = Field(..., ge=0, le=23)
    tipo_incidente: str
    tipo_emergencia: str


class PrediccionOut(BaseModel):
    prob_valido: float
    prob_no_valido: float
    estado_sugerido: Literal["VERIFIED", "PROBABLE", "PENDING"]
    umbral_valido: float
    umbral_probable: float
    version_modelo: str


def _estado(p: float) -> str:
    if p >= UMBRAL_VALIDO:
        return "VERIFIED"
    if p >= UMBRAL_PROBABLE:
        return "PROBABLE"
    return "PENDING"


def _predecir(reps: List[ReporteIn]) -> List[PrediccionOut]:
    X = np.vstack([reporte_a_vector(r.model_dump()) for r in reps])
    probas = modelo.predict_proba(X)[:, 1]
    return [
        PrediccionOut(
            prob_valido=round(float(p), 6),
            prob_no_valido=round(float(1 - p), 6),
            estado_sugerido=_estado(float(p)),
            umbral_valido=UMBRAL_VALIDO,
            umbral_probable=UMBRAL_PROBABLE,
            version_modelo=META["version"],
        )
        for p in probas
    ]


@app.get("/health")
def health():
    return {"status": "ok", "modelo": META["nombre"], "version": META["version"],
            "n_features": META["n_features"], "umbrales": META["umbrales"]}


@app.get("/metadata")
def metadata():
    return META


@app.post("/predict", response_model=PrediccionOut)
def predict(reporte: ReporteIn):
    return _predecir([reporte])[0]


@app.post("/predict/batch", response_model=List[PrediccionOut])
def predict_batch(reportes: List[ReporteIn]):
    if not reportes:
        raise HTTPException(400, "Lista vacía")
    if len(reportes) > 1000:
        raise HTTPException(413, "Máximo 1000 reportes por llamada")
    return _predecir(reportes)
