import sqlite3
from datetime import datetime

import os
DB_PATH = os.path.join(os.path.dirname(__file__), "irrigation.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS readings (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp   TEXT,
        moisture    REAL,
        temperature REAL,
        humidity    REAL,
        pump_on     INTEGER,
        prediction  TEXT,
        confidence  REAL
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS pump_logs (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp           TEXT,
        action              TEXT,
        reason              TEXT,
        moisture_at_trigger REAL
    )''')
    conn.commit()
    conn.close()

def insert_reading(data):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''INSERT INTO readings
        (timestamp, moisture, temperature, humidity, pump_on, prediction, confidence)
        VALUES (?,?,?,?,?,?,?)''',
        (data['timestamp'],
         data['Soil Moisture'],
         data['Temperature'],
         data[' Soil Humidity'],
         int(data['pump_on']),
         data.get('prediction', ''),
         data.get('confidence', 0)))
    conn.commit()
    conn.close()

def insert_pump_log(action, reason, moisture):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''INSERT INTO pump_logs
        (timestamp, action, reason, moisture_at_trigger)
        VALUES (?,?,?,?)''',
        (datetime.now().isoformat(), action, reason, moisture))
    conn.commit()
    conn.close()

def get_history(limit=100):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''SELECT timestamp, moisture, temperature, humidity,
                        pump_on, prediction, confidence
                 FROM readings ORDER BY id DESC LIMIT ?''', (limit,))
    rows = c.fetchall()
    conn.close()
    return [{"timestamp": r[0], "moisture": r[1], "temperature": r[2],
             "humidity": r[3], "pump_on": bool(r[4]),
             "prediction": r[5], "confidence": r[6]} for r in rows]

def get_pump_logs(limit=20):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''SELECT timestamp, action, reason, moisture_at_trigger
                 FROM pump_logs ORDER BY id DESC LIMIT ?''', (limit,))
    rows = c.fetchall()
    conn.close()
    return [{"timestamp": r[0], "action": r[1],
             "reason": r[2], "moisture": r[3]} for r in rows]