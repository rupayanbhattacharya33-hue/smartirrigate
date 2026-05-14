import numpy as np
import random
from datetime import datetime

class SoilSimulator:
    def __init__(self):
        self.moisture    = 65.0
        self.temperature = 28.0
        self.soil_humidity = 45.0
        self.air_temp    = 24.0
        self.wind_speed  = 9.5
        self.air_humidity = 58.0
        self.wind_gust   = 15.0
        self.pressure    = 101.13
        self.ph          = 6.47
        self.rainfall    = 103.0
        self.N = 50.0; self.P = 53.0; self.K = 48.0
        self.time        = 0
        self.pump_on     = False
        self.pump_duration = 0

    def update(self):
        hour = datetime.now().hour
        self.time = (self.time + 1) % 111

        # Temperature varies by time of day
        if 6 <= hour <= 14:
            self.temperature = min(45, self.temperature + random.uniform(0.1, 0.4))
            self.air_temp    = min(45, self.air_temp + random.uniform(0.05, 0.2))
        elif 14 < hour <= 20:
            self.temperature = max(10, self.temperature - random.uniform(0.1, 0.3))
            self.air_temp    = max(11, self.air_temp - random.uniform(0.05, 0.15))
        else:
            self.temperature = max(5,  self.temperature - random.uniform(0.05, 0.1))
            self.air_temp    = max(11, self.air_temp - random.uniform(0.02, 0.08))

        # Humidity inversely related to temperature
        self.air_humidity  = max(0.6,  min(96, 100 - self.air_temp + random.uniform(-5, 5)))
        self.soil_humidity = max(20,   min(70,  self.soil_humidity + random.uniform(-1, 1)))

        # Wind
        self.wind_speed = max(0, min(31, self.wind_speed + random.uniform(-1, 1)))
        self.wind_gust  = max(0, min(133, self.wind_speed * random.uniform(1.5, 2.5)))
        self.pressure   = max(100.5, min(101.86, self.pressure + random.uniform(-0.05, 0.05)))

        # Soil values drift slowly
        self.ph       = max(3.5, min(9.9, self.ph + random.uniform(-0.02, 0.02)))
        self.rainfall = max(20,  min(298, self.rainfall + random.uniform(-1, 1)))
        self.N = max(0, min(140, self.N + random.uniform(-0.5, 0.5)))
        self.P = max(5, min(145, self.P + random.uniform(-0.5, 0.5)))
        self.K = max(5, min(205, self.K + random.uniform(-0.5, 0.5)))

        # Moisture evaporation
        evaporation = (self.temperature / 45) * random.uniform(0.3, 0.8)
        self.moisture = max(1, self.moisture - evaporation)

        # Pump waters the soil
        if self.pump_on:
            self.moisture = min(90, self.moisture + random.uniform(3, 6))
            self.pump_duration += 1
            if self.pump_duration >= 5 or self.moisture >= 80:
                self.pump_on = False
                self.pump_duration = 0

        self.moisture = max(1, min(90, self.moisture + random.uniform(-0.3, 0.3)))

        return {
            "Soil Moisture":        round(self.moisture, 2),
            "Temperature":          round(self.temperature, 2),
            " Soil Humidity":       round(self.soil_humidity, 2),
            "Time":                 int(self.time),
            "Air temperature (C)":  round(self.air_temp, 2),
            "Wind speed (Km/h)":    round(self.wind_speed, 2),
            "Air humidity (%)":     round(self.air_humidity, 2),
            "Wind gust (Km/h)":     round(self.wind_gust, 2),
            "Pressure (KPa)":       round(self.pressure, 2),
            "ph":                   round(self.ph, 2),
            "rainfall":             round(self.rainfall, 2),
            "N":                    round(self.N, 2),
            "P":                    round(self.P, 2),
            "K":                    round(self.K, 2),
            "pump_on":              self.pump_on,
            "timestamp":            datetime.now().isoformat()
        }

    def turn_pump_on(self):
        self.pump_on = True
        self.pump_duration = 0

    def turn_pump_off(self):
        self.pump_on = False
        self.pump_duration = 0