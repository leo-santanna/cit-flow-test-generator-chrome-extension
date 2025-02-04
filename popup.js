const BASE_URL = "https://dev.flow.ciandt.com";
const AUTH_API_URL = `${BASE_URL}/auth-engine-api/v1/api-key/token`;
const OPEN_AI_AGENTS_API_URL = `${BASE_URL}/ai-orchestration-api/v1/openai/chat/completions`;
const GEMINI_AGENTS_API_URL = `${BASE_URL}/ai-orchestration-api/v1/google/generateContent`;
const BEDROCK_AGENTS_API_URL = `${BASE_URL}/ai-orchestration-api/v1/bedrock/invoke`;

const CLIENT_ID = "";
const CLIENT_SECRET = "";
const TENANT = "cit-dev";

async function getTabHtmlContent() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          function: grabHtmlContent,
        },
        (results) => {
          if (results && results[0] && results[0].result) {
            resolve(results[0].result);
          } else {
            reject(new Error("Failed to retrieve HTML content"));
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
  const flowResponse = document.getElementById("flow-response").textContent;
  const tempTextArea = document.createElement("textarea");
  tempTextArea.value = flowResponse;
  document.body.appendChild(tempTextArea);
  tempTextArea.select();
  document.execCommand("copy");
  document.body.removeChild(tempTextArea);
  alert("Copied to clipboard!");
}

function copyToClipboard() {
  const flowResponse = document.getElementById("flow-response").textContent;
  const tempTextArea = document.createElement("textarea");
  tempTextArea.value = flowResponse;
  document.body.appendChild(tempTextArea);
  tempTextArea.select();
  document.execCommand("copy");
  document.body.removeChild(tempTextArea);
  alert("Copied to clipboard!");
}

async function submitPrompt() {
  try {
    const content = document.getElementById("flow-prompt").value;
    const pageHtmlContent = await getTabHtmlContent();
    const selectedLanguage = document.getElementById("language-select").value;

    const prompt = getPrompt(selectedLanguage, pageHtmlContent, content);

    // Retrieve client ID and client secret from the configuration
    const clientId = CLIENT_ID;
    const clientSecret = CLIENT_SECRET;
    const tenant = TENANT;
    const model = "gpt-4o";

    if (!clientId || !clientSecret || !tenant || !model) {
      throw new Error(
        "Missing configuration. Please provide the client ID, client secret, and tenant."
      );
    }

    // Show loading icon and hide response and error message
    document.getElementById("submit-prompt").disabled = true;
    document.getElementById("submit-prompt").innerHTML = "Generating...";
    document.getElementById("loading-icon").style.display = "block";
    document.getElementById("flow-response").style.display = "none";
    document.getElementById("copy-response").style.display = "none";
    document.getElementById("error-message").style.display = "none";

    const token = await fetchAuthToken(clientId, clientSecret, tenant);
    const apiUrl = getCompletionApiUrlBasedOnModel(model);
    const requestBody = getTestGeneratorRequest(prompt, model);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        FlowAgent: "Copilot",
        FlowTenant: tenant,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const chatResponse = getTestGeneratorResponse(data, model);
    if (!chatResponse) {
      throw new Error(`Failed to generate response. No response from API.`);
    }

    const md = window.markdownit({
      highlight: function (str, lang) {
        if (lang && window.hljs.getLanguage(lang)) {
          try {
            return window.hljs.highlight(str, { language: lang }).value;
          } catch (__) {}
        }
        return ""; // use external default escaping
      },
    });

    const result = md.render(chatResponse);
    document.getElementById("flow-response").innerHTML = result;

    // Hide loading icon and show response
    document.getElementById("loading-icon").style.display = "none";
    document.getElementById("flow-response").style.display = "block";
    document.getElementById("copy-response").style.display = "block";
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("loading-icon").style.display = "none";
    document.getElementById("copy-response").style.display = "none";
    document.getElementById("error-message").textContent =
      "An error occurred while calling the Flow API.";
    document.getElementById("error-message").style.display = "block";
  } finally {
    document.getElementById("submit-prompt").disabled = false;
    document.getElementById("submit-prompt").innerHTML = "Generate tests";
  }
}

async function fetchAuthToken(clientId, clientSecret, tenant) {
  try {
    const response = await fetch(AUTH_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        FlowTenant: tenant,
      },
      body: JSON.stringify({
        clientId,
        clientSecret,
        appToAccess: "llm-api",
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    throw new Error("Failed to fetch auth token");
  }
}

function getTestGeneratorRequest(prompt, model) {
  switch (model) {
    case "gpt-4o-mini":
    case "gpt-4o":
      return createOpenAiChatRequest(prompt, model);
    case "gemini-1.5-flash":
    case "gemini-1.5-pro":
      return createGeminiChatRequest(prompt, model);
    case "anthropic.claude-3-sonnet":
    case "anthropic.claude-35-sonnet":
      return createBedrockChatRequest(prompt, model);
    default:
      throw new Error("Invalid model");
  }
}

function getTestGeneratorResponse(data, model) {
  switch (model) {
    case "gpt-4o-mini":
    case "gpt-4o":
      return getOpenAiChatResponse(data);
    case "gemini-1.5-flash":
    case "gemini-1.5-pro":
      return getGeminiChatResponse(data);
    case "anthropic.claude-3-sonnet":
    case "anthropic.claude-35-sonnet":
      return getBedrockChatResponse(data);
    default:
      throw new Error("Invalid model");
  }
}

function getCompletionApiUrlBasedOnModel(model) {
  switch (model) {
    case "gpt-4o-mini":
    case "gpt-4o":
      return OPEN_AI_AGENTS_API_URL;
    case "gemini-1.5-flash":
    case "gemini-1.5-pro":
      return GEMINI_AGENTS_API_URL;
    case "anthropic.claude-3-sonnet":
    case "anthropic.claude-35-sonnet":
      return BEDROCK_AGENTS_API_URL;
    default:
      throw new Error("Invalid model");
  }
}

function createOpenAiChatRequest(prompt, model) {
  return {
    model: model,
    stream: false,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  };
}

function createGeminiChatRequest(prompt, model) {
  return {
    model: model,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
  };
}

function createBedrockChatRequest(prompt, model) {
  return {
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ],
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 200000,
    allowedModels: [model],
  };
}

function getOpenAiChatResponse(data) {
  return data.choices?.[0]?.message?.content;
}

function getGeminiChatResponse(data) {
  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

function getBedrockChatResponse(data) {
  return data.content?.[0]?.text;
}

document
  .getElementById("copy-response")
  .addEventListener("click", copyToClipboard);
document
  .getElementById("submit-prompt")
  .addEventListener("click", submitPrompt);
document
  .getElementById("copy-response")
  .addEventListener("click", copyToClipboard);
document
  .getElementById("submit-prompt")
  .addEventListener("click", submitPrompt);

document.getElementById("flow-prompt").addEventListener("input", function () {
  const text = this.value.trim();
  const words = text.split(/\s+/);
  const generateTestsButton = document.getElementById("submit-prompt");

  if (words.length < 2) {
    generateTestsButton.disabled = true;
    return;
  }

  generateTestsButton.classList.remove("disabled");
  generateTestsButton.disabled = false;
});

document
  .getElementById("flow-prompt")
  .addEventListener("keydown", function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      document.getElementById("submit-prompt").click();
    }
  });

const PromptType = {
  Cypress: "Cypress",
  Robot: "Robot",
};

function getPrompt(promptType, htmlContent, testRequest) {
  switch (promptType) {
    case PromptType.Cypress:
      return `Generate a Cypress test script for the following HTML content:

              HTML Content:
              ${htmlContent}

              Test Request:
              ${testRequest}

              Requirements:
              - Use the provided HTML content.
              - Align the test with the specified context and request.
              - Ensure the test is complete and functional.
              - Write just the test code without any additional explanations before or after the code.
              - Make sure to include comments explaining the purpose of each step in the test code itself.`;
    case PromptType.Robot:
      return `Generate a Robot test script for the following HTML content:
          
              HTML Content:
              ${htmlContent}

              Test Request:
              ${testRequest}

              Requirements:
              - Use the provided HTML content.
              - Align the test with the specified context and request.
              - Ensure the test is complete and functional.
              - Write just the test code without any additional explanations before or after the code.
              - Make sure to include comments explaining the purpose of each step in the test code itself.`;
    default:
      throw new Error(`Unknown prompt type: ${promptType}`);
  }
}

// Populate the language selection dropdown
document.addEventListener("DOMContentLoaded", () => {
  const languageSelect = document.getElementById("language-select");
  for (const key in PromptType) {
    const option = document.createElement("option");
    option.value = PromptType[key];
    option.textContent = PromptType[key];
    languageSelect.appendChild(option);
  }
});
