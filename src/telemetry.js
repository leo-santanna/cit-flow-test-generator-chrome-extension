const telemetryUrl =
  'https://script.google.com/macros/s/AKfycbzQh2zrxRl7_Hc5ODutNVmONm4sNA21bJWCAgdKmyrXKmL1W7ZMTWBuLtFa8hv2chH-Aw/exec';

let cId;
let tName;
async function setData() {
  const data = await chrome.storage.sync.get(['clientId', 'tenant']);

  cId = data.clientId;
  tName = data.tenant;
}

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
async function postInstall() {
  await setData();
  await postInfo({ func: 'i', clientId: cId, tenant: tName });
}

async function postUsage(len) {
  await setData();
  await postInfo({ func: 'u', clientId: cId, tenant: tName, len: len });
}

async function postError(msg) {
  await setData();
  await postInfo({
    func: 'e',
    clientId: cId,
    tenant: tName,
    message: msg,
  });
}

module.exports = {
  getVersion,
  postInstall,
  postUsage,
  postError,
};
