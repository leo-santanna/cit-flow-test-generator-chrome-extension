const BASE_URL = 'https://flow.ciandt.com';
const AUTH_API_URL = `${BASE_URL}/auth-engine-api/v1/api-key/token`;
const OPEN_AI_AGENTS_API_URL = `${BASE_URL}/ai-orchestration-api/v1/openai/chat/completions`;
const GEMINI_AGENTS_API_URL = `${BASE_URL}/ai-orchestration-api/v1/google/generateContent`;
const BEDROCK_AGENTS_API_URL = `${BASE_URL}/ai-orchestration-api/v1/bedrock/invoke`;

const CLIENT_ID = '';
const CLIENT_SECRET = '';
const TENANT = '';

async function fetchAuthToken(clientId, clientSecret, tenant) {
  try {
    const response = await fetch(AUTH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        FlowTenant: tenant,
      },
      body: JSON.stringify({
        clientId,
        clientSecret,
        appToAccess: 'llm-api',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    throw new Error('Failed to fetch auth token');
  }
}

function getTestGeneratorRequest(prompt, model) {
  switch (model) {
    case 'gpt-4o-mini':
    case 'gpt-4o':
      return createOpenAiChatRequest(prompt, model);
    case 'gemini-1.5-flash':
    case 'gemini-1.5-pro':
      return createGeminiChatRequest(prompt, model);
    case 'anthropic.claude-3-sonnet':
    case 'anthropic.claude-35-sonnet':
      return createBedrockChatRequest(prompt, model);
    default:
      throw new Error('Invalid model');
  }
}

function getTestGeneratorResponse(data, model) {
  switch (model) {
    case 'gpt-4o-mini':
    case 'gpt-4o':
      return getOpenAiChatResponse(data);
    case 'gemini-1.5-flash':
    case 'gemini-1.5-pro':
      return getGeminiChatResponse(data);
    case 'anthropic.claude-3-sonnet':
    case 'anthropic.claude-35-sonnet':
      return getBedrockChatResponse(data);
    default:
      throw new Error('Invalid model');
  }
}

function getCompletionApiUrlBasedOnModel(model) {
  switch (model) {
    case 'gpt-4o-mini':
    case 'gpt-4o':
      return OPEN_AI_AGENTS_API_URL;
    case 'gemini-1.5-flash':
    case 'gemini-1.5-pro':
      return GEMINI_AGENTS_API_URL;
    case 'anthropic.claude-3-sonnet':
    case 'anthropic.claude-35-sonnet':
      return BEDROCK_AGENTS_API_URL;
    default:
      throw new Error('Invalid model');
  }
}

function createOpenAiChatRequest(prompt, model) {
  return {
    model: model,
    stream: false,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
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
        role: 'user',
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
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
    anthropic_version: 'bedrock-2023-05-31',
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
function checkCredentials() {
  if (!CLIENT_ID || !CLIENT_SECRET || !TENANT) {
    return false;
  }
  return true;
}

async function executeFlowRequest(prompt, model) {
  const token = await fetchAuthToken(CLIENT_ID, CLIENT_SECRET, TENANT);
  const apiUrl = getCompletionApiUrlBasedOnModel(model);
  const requestBody = getTestGeneratorRequest(prompt, model);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      FlowAgent: 'Copilot',
      FlowTenant: tenant,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();

  return getTestGeneratorResponse(data, model);
}
module.exports = {
  executeFlowRequest,
  checkCredentials,
};
