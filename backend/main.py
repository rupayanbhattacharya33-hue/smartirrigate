from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
import joblib
import numpy as np
import pandas as pd
from simulator import SoilSimulator
from database import (init_db, insert_reading, insert_pump_log,
                      get_history, get_pump_logs)
from weather import get_weather, get_forecast

app = FastAPI(title="SmartIrrigate API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# ── Load model ────────────────────────────────────────────────────
model      = joblib.load("models/irrigation_model.pkl")
feat_names = joblib.load("models/feature_names.pkl")

# Note: feat_names has a space in ' Soil Humidity' — preserved exactly
FEAT_NAMES = [
    'Soil Moisture', 'Temperature', ' Soil Humidity', 'Time',
    'Air temperature (C)', 'Wind speed (Km/h)', 'Air humidity (%)',
    'Wind gust (Km/h)', 'Pressure (KPa)', 'ph', 'rainfall', 'N', 'P', 'K'
]

# ── Init ──────────────────────────────────────────────────────────
init_db()
sim    = SoilSimulator()
latest = {}

def run_simulation():
    global latest
    data = sim.update()

    # Build dataframe with exact column names model was trained on
    inp = pd.DataFrame([[
        data['Soil Moisture'],
        data['Temperature'],
        data[' Soil Humidity'],
        data['Time'],
        data['Air temperature (C)'],
        data['Wind speed (Km/h)'],
        data['Air humidity (%)'],
        data['Wind gust (Km/h)'],
        data['Pressure (KPa)'],
        data['ph'],
        data['rainfall'],
        data['N'],
        data['P'],
        data['K'],
    ]], columns=FEAT_NAMES)

    pred_proba  = model.predict_proba(inp)[0]
    pred        = model.predict(inp)[0]
    confidence  = float(max(pred_proba))
    # Model was trained with LabelEncoder: OFF=0, ON=1
    prediction  = "WATER" if pred == 1 else "WAIT"

    # Rain check
    forecast   = get_forecast()
    rain_prob  = forecast.get("rain_probability_6h", 0)

    # Smart pump decision
    moisture = data['Soil Moisture']
    if prediction == "WATER" and rain_prob < 70:
        if not sim.pump_on and moisture < 40:
            sim.turn_pump_on()
            insert_pump_log("ON",
                f"ML → WATER (conf {confidence:.0%})", moisture)
    elif moisture >= 80 and sim.pump_on:
        sim.turn_pump_off()
        insert_pump_log("OFF", "Moisture reached 80%", moisture)
    elif rain_prob >= 70 and sim.pump_on:
        sim.turn_pump_off()
        insert_pump_log("OFF", f"Rain expected {rain_prob}%", moisture)

    data['prediction']    = prediction
    data['confidence']    = confidence
    data['rain_probability'] = rain_prob
    latest = data
    insert_reading(data)

# ── Scheduler — every 30 seconds ─────────────────────────────────
scheduler = BackgroundScheduler()
scheduler.add_job(run_simulation, 'interval', seconds=30)
scheduler.start()
run_simulation()   # run immediately on startup

# ── Routes ────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "SmartIrrigate API running!"}

@app.get("/latest")
def get_latest():
    return latest

@app.get("/history")
def history(limit: int = 50):
    return get_history(limit)

@app.get("/pump-logs")
def pump_logs():
    return get_pump_logs()

@app.get("/weather")
def weather():
    w = get_weather()
    f = get_forecast()
    w["rain_probability_6h"] = f["rain_probability_6h"]
    return w

@app.post("/pump/on")
def pump_on():
    sim.turn_pump_on()
    insert_pump_log("ON", "Manual override",
                    latest.get("Soil Moisture", 0))
    return {"status": "Pump turned ON manually"}

@app.post("/pump/off")
def pump_off():
    sim.turn_pump_off()
    insert_pump_log("OFF", "Manual override",
                    latest.get("Soil Moisture", 0))
    return {"status": "Pump turned OFF manually"}