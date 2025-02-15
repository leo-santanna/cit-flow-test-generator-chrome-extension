const { removeNonInteractiveElements } = require('./minifyHtml');
const { executeFlowRequest, checkCredentials } = require('./flowHandler');

const markdownit = require('markdown-it');
const hljs = require('highlight.js');

async function getTabData() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const tab = tabs[0];
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          function: grabHtmlContent,
        },
        (results) => {
          if (results && results[0] && results[0].result) {
            resolve({ url: tab.url, htmlContent: results[0].result });
          } else {
            reject(new Error('Failed to retrieve HTML content'));
          }
        }
      );
    });
  });
}

function grabHtmlContent() {
  return document.documentElement.outerHTML;
}

function copyToClipboard() {
  const flowResponse = document.getElementById('flow-response').textContent;
  const tempTextArea = document.createElement('textarea');
  tempTextArea.value = flowResponse;
  document.body.appendChild(tempTextArea);
  tempTextArea.select();
  document.execCommand('copy');
  document.body.removeChild(tempTextArea);
  alert('Copied to clipboard!');
}

async function submitPrompt() {
  try {
    const content = document.getElementById('flow-prompt').value;
    const activeTabData = await getTabData();

    activeTabData.htmlContent = removeNonInteractiveElements(
      activeTabData.htmlContent
    );

    const selectedLanguage = document.getElementById('language-select').value;
    const prompt = getPrompt(selectedLanguage, activeTabData, content);

    const model = 'gpt-4o';

    if (!checkCredentials()) {
      throw new Error(
        'Missing configuration. Please provide the client ID, client secret, and tenant.'
      );
    }

    // Show loading icon and hide response and error message
    document.getElementById('submit-prompt').disabled = true;
    document.getElementById('submit-prompt').innerHTML = 'Generating...';
    document.getElementById('loading-icon').style.display = 'block';
    document.getElementById('flow-response').style.display = 'none';
    document.getElementById('copy-response').style.display = 'none';
    document.getElementById('error-message').style.display = 'none';

    const chatResponse = await executeFlowRequest(prompt, model);

    if (!chatResponse) {
      throw new Error(`Failed to generate response. No response from API.`);
    }

    const md = markdownit({
      highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(str, { language: lang }).value;
          } catch (__) {}
        }
        return ''; // use external default escaping
      },
    });
    const result = md.render(chatResponse);
    document.getElementById('flow-response').innerHTML = result;

    // Hide loading icon and show response
    document.getElementById('loading-icon').style.display = 'none';
    document.getElementById('flow-response').style.display = 'block';
    document.getElementById('copy-response').style.display = 'block';
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('loading-icon').style.display = 'none';
    document.getElementById('copy-response').style.display = 'none';
    document.getElementById('error-message').textContent =
      'An error occurred while calling the Flow API.';
    document.getElementById('error-message').style.display = 'block';
  } finally {
    document.getElementById('submit-prompt').disabled = false;
    document.getElementById('submit-prompt').innerHTML = 'Generate tests';
  }
}

const PromptType = {
  CodeceptJS: 'CodeceptJS',
  Cypress: 'Cypress',
  Galen: 'Galen',
  Selenium: 'Selenium',
  Playwright: 'Playwright',
  TestCafe: 'TestCafe',
  Puppeteer: 'Puppeteer',
  Robot: 'Robot',
};

function getPrompt(promptType, tabData, testRequest) {
  return `You are an expert in both HTML and functional test generation. Given the following inputs, generate functional  tests as per the user's request using the specified framework:

  Page URL:
  ${tabData.url}

  HTML Source Code:
  \`\`\`html
  ${tabData.htmlContent}
  \`\`\`

  Framework:
  ${promptType}

  User Request:
  ${testRequest}

  Requirements:
  - Ensure the generated tests are complete, adhere to best practices, and are formatted correctly for the specified framework.
  - Use the provided HTML content.
  - Align the test with the specified context and request.
  - Ensure the test is complete and functional.
  - Write just the test code without any additional explanations before or after the code.
  - Make sure to include comments explaining the purpose of each step in the test code itself.
  - Output the tests as a code block in the appropriate syntax for the selected framework.`;
}

document.addEventListener('DOMContentLoaded', function () {
  const languageSelect = document.getElementById('language-select');
  for (const key in PromptType) {
    const option = document.createElement('option');
    option.value = PromptType[key];
    option.textContent = PromptType[key];
    languageSelect.appendChild(option);
  }

  document
    .getElementById('copy-response')
    .addEventListener('click', copyToClipboard);
  document
    .getElementById('submit-prompt')
    .addEventListener('click', submitPrompt);
  document
    .getElementById('copy-response')
    .addEventListener('click', copyToClipboard);
  document
    .getElementById('submit-prompt')
    .addEventListener('click', submitPrompt);

  document.getElementById('flow-prompt').addEventListener('input', function () {
    const text = this.value.trim();
    const words = text.split(/\s+/);
    const generateTestsButton = document.getElementById('submit-prompt');

    if (words.length < 2) {
      generateTestsButton.disabled = true;
      return;
    }

    generateTestsButton.classList.remove('disabled');
    generateTestsButton.disabled = false;
    document.getElementById('flow-prompt').value = 'generate a page object';
  });

  document
    .getElementById('flow-prompt')
    .addEventListener('keydown', function (event) {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('submit-prompt').click();
      }
    });
});
