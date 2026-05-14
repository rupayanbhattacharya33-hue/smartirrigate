import requests

API_KEY = "38b903fcfc36cd20d00769a7b376d02b"
CITY    = "Kolkata"

def get_weather():
    try:
        url = (f"http://api.openweathermap.org/data/2.5/weather"
               f"?q={CITY}&appid={API_KEY}&units=metric")
        r    = requests.get(url, timeout=5)
        data = r.json()
        return {
            "city":             CITY,
            "temperature":      data["main"]["temp"],
            "humidity":         data["main"]["humidity"],
            "description":      data["weather"][0]["description"],
            "icon":             data["weather"][0]["icon"],
            "rain_probability": 0
        }
    except:
        return {
            "city":             CITY,
            "temperature":      28,
            "humidity":         65,
            "description":      "Weather unavailable",
            "icon":             "01d",
            "rain_probability": 0
        }

def get_forecast():
    try:
        url = (f"http://api.openweathermap.org/data/2.5/forecast"
               f"?q={CITY}&appid={API_KEY}&units=metric&cnt=4")
        r    = requests.get(url, timeout=5)
        data = r.json()
        rain_chance = 0
        for item in data.get("list", []):
            rain_chance = max(rain_chance, item.get("pop", 0) * 100)
        return {"rain_probability_6h": round(rain_chance, 1)}
    except:
        return {"rain_probability_6h": 0}