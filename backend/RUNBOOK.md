# SNAM Baitong Backend Runbook (Telegram ↔ Backend ↔ Sensor)

This guide walks you through:
- Exposing the backend to Telegram via ngrok HTTPS
- Starting the local MQTT broker and exposing it to a remote sensor via ngrok (TCP or WebSocket)
- Verifying end-to-end commands from Telegram to the sensor

## Prerequisites
- Node.js 18+ installed on the backend machine
- ngrok installed (`https://ngrok.com/download`) and authed (`ngrok config add-authtoken <token>`)
- Backend .env configured with Telegram token and chat ID

## 1) Install and start the backend
```bash
cd backend
npm install
npm run dev
```
Backend runs on `http://localhost:3000`. Webhook endpoint: `/api/telegram/webhook`.

## 2) Expose backend to Telegram via ngrok (HTTPS)
In a new terminal:
```bash
ngrok http 3000
```
Copy the HTTPS URL (e.g., `https://your-subdomain.ngrok-free.app`). Set the Telegram webhook:
```bash
cd backend
node src/scripts/set-telegram-webhook.js https://yuk-nonpedagogic-pridelessly.ngrok-free.dev
node src/scripts/get-telegram-webhook-info.js
```
You should see the webhook pointing to `/api/telegram/webhook` under your ngrok URL.

Test with your bot: send `/update`. The backend replies with latest data or "No data available." Available commands: `/update`, `/irrigate` (pump ON), `/stop` (pump OFF).

## 3) Start the local MQTT broker
Optional: enable username/password auth by adding to `backend/.env`:
```
MQTT_USERNAME=<choose-username>
MQTT_PASSWORD=<choose-strong-password>
```
Start the broker:
```bash
cd backend
npm run mqtt:broker
```
Broker listens on:
- TCP: `mqtt://localhost:1883`
- WebSocket: `ws://localhost:8083/mqtt`

## 4) Expose the broker for the remote sensor (choose ONE)
### Option A — TCP tunnel (recommended if sensor supports raw MQTT TCP)
```bash
ngrok tcp 1883
```
Share with the sensor owner:
- Host: `0.tcp.ngrok.io`
- Port: `xxxxx` (number infront of 0.tcp.ngrok.io)
- Username/Password: if you set `MQTT_USERNAME`/`MQTT_PASSWORD`
- Subscribe topic: `farm/pump/control` (receives `ON`/`OFF`)
- Publish topic: your sensor data topic (e.g., `sensors/soil_sensor/data`)

### Option B — WebSocket tunnel (use only if sensor supports MQTT over WebSocket)
```bash
ngrok http 8083
```
Share with the sensor owner:
- WSS URL: `wss://your-subdomain.ngrok-free.app/mqtt`
- Port: `443`
- Username/Password: if set
- Subscribe topic: `farm/pump/control`
- Publish topic: your sensor data topic

> Note: Free ngrok endpoints change each run; reserved addresses/subdomains require paid plan. Keep auth enabled if exposing publicly.

## 5) End-to-end verification
- With broker + backend + ngrok tunnels running and the sensor connected:
  - In Telegram: send `/irrigate` → sensor should receive `ON` (topic `farm/pump/control`).
  - In Telegram: send `/stop` → sensor should receive `OFF`.
  - In Telegram: send `/update` → backend replies with latest sensor values.

## Sensor-side examples (to share)
### Python (paho-mqtt) — TCP MQTT
```python
import paho.mqtt.client as mqtt
import json, time

HOST = "x.tcp.ngrok.io"
PORT = 12345
USER = "youruser"
PASS = "yourpass"
CLIENT_ID = "sensor-01"
SUB_TOPIC = "farm/pump/control"
PUB_TOPIC = "sensors/soil_sensor/data"

def on_connect(client, userdata, flags, rc, properties=None):
    print("connected:", rc)
    client.subscribe(SUB_TOPIC)

def on_message(client, userdata, msg):
    print("cmd:", msg.topic, msg.payload.decode())

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=CLIENT_ID, clean_session=True)
client.username_pw_set(USER, PASS)
client.on_connect = on_connect
client.on_message = on_message
client.connect(HOST, PORT, keepalive=30)
client.loop_start()

while True:
    payload = {"temperature": 25.1, "moisture": 55.2}
    client.publish(PUB_TOPIC, json.dumps(payload), qos=0, retain=False)
    time.sleep(10)
```

### Python (paho-mqtt) — WebSocket MQTT
```python
import paho.mqtt.client as mqtt
import json, time

HOST = "your-subdomain.ngrok-free.app"
PORT = 443
USER = "youruser"
PASS = "yourpass"
CLIENT_ID = "sensor-01"
SUB_TOPIC = "farm/pump/control"
PUB_TOPIC = "sensors/soil_sensor/data"

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=CLIENT_ID, transport="websockets")
client.username_pw_set(USER, PASS)
client.tls_set()  # wss requires TLS
client.ws_set_options(path="/mqtt")

client.connect(HOST, PORT, keepalive=30)
client.loop_start()

while True:
    payload = {"temperature": 25.1, "moisture": 55.2}
    client.publish(PUB_TOPIC, json.dumps(payload), qos=0, retain=False)
    time.sleep(10)
```

## Troubleshooting
- Webhook not triggered: ensure `ngrok http 3000` running; re-run the webhook setup with the current ngrok URL.
- Sensor cannot connect: verify whether it supports TCP vs WebSocket, check host/port/URL and credentials, watch broker logs for connect/auth events.
- Exit code 130: indicates interruption (Ctrl+C). Re-run the command without interrupting.

## Security & Stability
- Keep `MQTT_USERNAME`/`MQTT_PASSWORD` enabled when exposing broker publicly.
- For stable endpoints, use ngrok reserved TCP address/subdomain, or a managed MQTT broker.
