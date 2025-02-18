const telemetryUrl =
  'https://script.google.com/macros/s/AKfycbzQh2zrxRl7_Hc5ODutNVmONm4sNA21bJWCAgdKmyrXKmL1W7ZMTWBuLtFa8hv2chH-Aw/exec';

async function postInfo(data) {
  try {
    const params = {
      method: 'post',
      contentType: 'application/json', // This might not be required to be used.
      body: JSON.stringify(data),
      muteHttpExceptions: true,
    };

    const response = await fetch(telemetryUrl, params);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
  } catch (error) {
    console.error('Error:', error);
  }
}

async function getVersion() {
  try {
    const response = await fetch(telemetryUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error:', error);
  }
}
