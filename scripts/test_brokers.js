import mqtt from 'mqtt';

const testBrokers = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8000/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://test.mosquitto.org:8081'
];

async function testBroker(url) {
  return new Promise((resolve) => {
    console.log(`Testing ${url}...`);
    const client = mqtt.connect(url, {
      connectTimeout: 5000,
      clientId: 'test_' + Math.random().toString(36).substring(2, 8)
    });

    const timer = setTimeout(() => {
      client.end(true);
      resolve({ url, success: false, error: 'Timeout' });
    }, 6000);

    client.on('connect', () => {
      clearTimeout(timer);
      client.end(true);
      resolve({ url, success: true });
    });

    client.on('error', (err) => {
      clearTimeout(timer);
      client.end(true);
      resolve({ url, success: false, error: err.message });
    });
  });
}

async function run() {
  for (const url of testBrokers) {
    const res = await testBroker(url);
    console.log(`Result for ${res.url}:`, res.success ? '✅ SUCCESS' : `❌ FAILED (${res.error})`);
  }
}

run();
