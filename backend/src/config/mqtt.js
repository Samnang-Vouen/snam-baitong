const url = require('url');

const MQTT_PROTOCOL = (process.env.MQTT_PROTOCOL || 'mqtt').toLowerCase(); // mqtt | mqtts | ws | wss
const MQTT_HOST = process.env.MQTT_HOST || 'localhost';
const MQTT_PORT = parseInt(process.env.MQTT_PORT || (MQTT_PROTOCOL === 'ws' ? '8083' : '1883'), 10);
const MQTT_USERNAME = process.env.MQTT_USERNAME || undefined;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || undefined;
const MQTT_TLS = /^true$/i.test(process.env.MQTT_TLS || (MQTT_PROTOCOL === 'mqtts' || MQTT_PROTOCOL === 'wss' ? 'true' : 'false'));
const MQTT_WS_PATH = process.env.MQTT_WS_PATH || '/mqtt';

const PUMP_TOPIC = process.env.MQTT_PUMP_TOPIC || 'farm/pump/control';
const PUMP_ON_PAYLOAD = process.env.PUMP_ON_PAYLOAD || 'ON';
const PUMP_OFF_PAYLOAD = process.env.PUMP_OFF_PAYLOAD || 'OFF';

function buildBrokerUrl() {
  const proto = MQTT_PROTOCOL || (MQTT_TLS ? 'mqtts' : 'mqtt');
  const base = `${proto}://${MQTT_HOST}:${MQTT_PORT}`;
  if (proto === 'ws' || proto === 'wss') {
    return new url.URL(`${base}${MQTT_WS_PATH}`).toString();
  }
  return new url.URL(base).toString();
}

module.exports = {
  buildBrokerUrl,
  MQTT_PROTOCOL,
  MQTT_HOST,
  MQTT_PORT,
  MQTT_USERNAME,
  MQTT_PASSWORD,
  MQTT_TLS,
  MQTT_WS_PATH,
  PUMP_TOPIC,
  PUMP_ON_PAYLOAD,
  PUMP_OFF_PAYLOAD,
};
