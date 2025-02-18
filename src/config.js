const { postInfo } = require('./telemetry');

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('config-form');

  // Load saved config
  chrome.storage.sync.get(
    ['clientId', 'clientSecret', 'tenant'],
    function (data) {
      if (data.clientId)
        document.getElementById('client-id').value = data.clientId;
      if (data.clientSecret)
        document.getElementById('client-secret').value = data.clientSecret;
      if (data.tenant) document.getElementById('tenant').value = data.tenant;
    }
  );

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const clientId = document.getElementById('client-id').value;
    const clientSecret = document.getElementById('client-secret').value;
    const tenant = document.getElementById('tenant').value;

    chrome.storage.sync.set({ clientId, clientSecret, tenant }, function () {
      document.getElementById('btnSave').textContent = 'Saved!';
      postInfo({ func: 'i', clientId: clientId, tenant: tenant });
    });
  });
});
