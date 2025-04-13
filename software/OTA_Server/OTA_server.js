// 필요한 모듈
const mqtt = require('mqtt');
const express = require('express');
const bodyParser = require('body-parser');

// MQTT 브로커 연결
const mqttClient = mqtt.connect('mqtt://your-mqtt-broker-address');

// 디바이스 목록 저장할 메모리 객체
const devices = {};

// MQTT 연결됐을 때
mqttClient.on('connect', () => {
    console.log('MQTT Connected');
    mqttClient.subscribe('device/+/status'); // 모든 디바이스 상태 구독
});

// 디바이스로부터 메시지 받을 때
mqttClient.on('message', (topic, message) => {
    const [_, deviceId, type] = topic.split('/'); // ex) device/ESP32_001/status
    if (type === 'status') {
        const payload = JSON.parse(message.toString());
        devices[deviceId] = {
            id: deviceId,
            firmware: payload.firmware,
            online: true,
            lastSeen: Date.now()
        };
        console.log(`[${deviceId}] 상태 업데이트:`, payload);
    }
});

// Express 앱 설정
const app = express();
app.use(bodyParser.json());

// 디바이스 목록 조회 API
app.get('/devices', (req, res) => {
    res.json(devices);
});

// 특정 디바이스 OTA 시작 명령 API
app.post('/ota/:deviceId', (req, res) => {
    const deviceId = req.params.deviceId;
    const firmwareUrl = req.body.firmwareUrl;

    if (!devices[deviceId]) {
        return res.status(404).json({ error: '디바이스를 찾을 수 없음' });
    }

    // OTA 명령 전송
    mqttClient.publish(`device/${deviceId}/ota`, JSON.stringify({
        url: firmwareUrl
    }));

    console.log(`[${deviceId}] 에 OTA 명령 전송: ${firmwareUrl}`);
    res.json({ success: true });
});

// 서버 실행
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`HTTP 서버 실행 중: http://localhost:${PORT}`);
});
