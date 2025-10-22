# 🎯 CampusGuessr

**CampusGuessr** is a UChicago-themed geography guessing game inspired by [GeoGuessr](https://www.geoguessr.com/).  
Players are shown a real photo taken somewhere on the UChicago campus and must guess **where it was taken** by clicking on a map.

---

## 🗺️ Features

- 🧭 **Interactive Leaflet Map** — Guess locations by clicking anywhere on the UChicago campus map.
- 📸 **Daily Photo Challenge** — Each day features a new image taken by a contributor.
- 🎨 **Rainbow Heat Scale Pins** — Pins transition smoothly from **black → purple → blue → green → yellow → orange → red**, with red being the closest.
- 🎯 **Precision Feedback** — Displays distance and direction from your guess to the correct location.
- 🕹️ **Limited Guesses** — You have 6 tries to pinpoint the spot within a configurable win radius.
- 🌍 **Satellite View** — Uses Esri’s World Imagery tiles for realistic campus visuals.
- 📏 **HUD & Stats** — See your guesses, remaining attempts, and solve status.
- 🔄 **Reset Option** — Try the puzzle again or start a new one.

---

## 🧰 Tech Stack

| Category | Technology |
|-----------|-------------|
| Frontend | React + Vite |
| Mapping | Leaflet + React-Leaflet |
| Styling | Tailwind CSS |
| Data | Local JSON or API (future) |
| Map Tiles | Esri World Imagery |