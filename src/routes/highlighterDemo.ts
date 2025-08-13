import { OpenAPIHono, createRoute } from '@hono/zod-openapi'

const router = new OpenAPIHono()

const demoRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      description: 'Returns the Highlighter demo page.',
      content: {
        'text/html': {
          schema: { type: 'string' }
        }
      }
    }
  },
  tags: ['Demos']
})

const samplePayload = `{
    "payload": {
        "text": "Hello, I need help with my recent order. I received the wrong item. Hi! I'm sorry to hear that. Could you please provide your order number so I can look into this for you? Sure, the order number is 123456789. I ordered a wireless mouse, but I received a wired one instead. Thank you for the information. Let me check your order details. Please hold on a moment. Okay, take your time. Thanks for waiting. I see that the order was for a wired mouse. It appears there was an inventory mistake. I apologize for the inconvenience. That's frustrating. Can you send me the correct item? Absolutely. I will initiate the process to send the wireless mouse to you immediately. You will receive it within 3-5 business days. Would you like a return label for the wired mouse? Yes, that would be great. Thank you. You're welcome! I will email you the return shipping label shortly. Is there anything else I can assist you with today? No, that's all. Thanks for your help. My pleasure! Have a great day!",
        "maxHighlights": 5
    },
    "config": {
        "provider": "openai",
        "model": "gpt-5",
        "temperature": 0
    }
}`

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Backends - Highlighter Demo</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .highlight-span { padding: 2px 4px; border-radius: 6px; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace; }
    .shadow-soft { box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
    .sticky-header { position: sticky; top: 0; z-index: 40; backdrop-filter: blur(10px); }
    .label-pill { border-radius: 9999px; padding: 2px 8px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <header class="sticky-header bg-white/80 border-b border-gray-200">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-[#B341F9] flex items-center justify-center">
          <span class="text-white font-bold text-xl">AI</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xl font-bold text-gray-900">AI Backends</span>         
        </div>
      </div>
      <nav class="text-sm">
        <a href="/api/ui" target="_blank" class="text-indigo-600 hover:text-indigo-800">Swagger UI</a>
      </nav>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-4 py-6">
    <!-- Demo Title and Description -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-3">Highlighter Demo</h1>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto">
        Highlight important parts of text using AI
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Controls -->
      <section class="bg-white p-4 rounded-xl border border-gray-200 shadow-soft">
        <h2 class="text-lg font-semibold mb-3">Input</h2>
        <label class="block text-sm font-medium text-gray-700 mb-1">Text</label>
        <textarea id="inputText" class="w-full h-48 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" placeholder="Enter text to analyze..."></textarea>

        <div class="grid grid-cols-2 gap-3 mt-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Max Highlights</label>
            <input id="maxHighlights" type="number" min="1" class="w-full p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" value="5" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
            <input id="temperature" type="number" step="0.1" min="0" max="1" class="w-full p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" value="0" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Provider</label>
            <select id="provider" class="w-full p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="openai">openai</option>
              <option value="anthropic">anthropic</option>
              <option value="ollama">ollama</option>
              <option value="openrouter">openrouter</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <input id="model" type="text" class="w-full p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" value="gpt-4.1" />
          </div>
        </div>

        <div class="mt-3">
          <label class="block text-sm font-medium text-gray-700 mb-1">Bearer Token (optional)</label>
          <input id="token" type="password" placeholder="Only needed in production deployments" class="w-full p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div class="mt-4 flex items-center gap-2">
          <button id="runBtn" class="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Highlight</button>
          <button id="cancelBtn" class="hidden px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Cancel</button>
          <button id="loadSample" class="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200">Load Sample</button>
        </div>

        <details class="mt-4">
          <summary class="text-sm text-gray-600 cursor-pointer">View JSON request</summary>
          <pre id="jsonPreview" class="mt-2 bg-gray-900 text-green-400 p-3 rounded-lg text-xs mono overflow-auto"></pre>
        </details>
      </section>

      <!-- Output -->
      <section class="bg-white p-4 rounded-xl border border-gray-200 shadow-soft">
        <h2 class="text-lg font-semibold mb-3">Output</h2>
        <div class="mb-3 text-sm text-gray-600 flex items-center gap-3">
          <div id="usageInfo" class="hidden"></div>
          <div id="labelLegend" class="flex flex-wrap gap-2"></div>
        </div>
        <div id="renderedText" class="p-4 rounded-lg bg-gray-50 border border-gray-200 leading-7"></div>
        <div class="mt-4">
          <h3 class="font-medium text-gray-900 mb-2">Highlights</h3>
          <ul id="highlightsList" class="space-y-2 text-sm"></ul>
        </div>
        <div id="summaryLine" class="mt-4 text-sm text-gray-700"></div>
      </section>
    </div>
  </main>

  <script>
    const sample = ${JSON.stringify(samplePayload)};
    const inputText = document.getElementById('inputText');
    const maxHighlightsEl = document.getElementById('maxHighlights');
    const temperatureEl = document.getElementById('temperature');
    const providerEl = document.getElementById('provider');
    const modelEl = document.getElementById('model');
    const tokenEl = document.getElementById('token');
    const runBtn = document.getElementById('runBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const loadSampleBtn = document.getElementById('loadSample');
    const renderedText = document.getElementById('renderedText');
    const highlightsList = document.getElementById('highlightsList');
    const labelLegend = document.getElementById('labelLegend');
    const usageInfo = document.getElementById('usageInfo');
    const summaryLine = document.getElementById('summaryLine');
    const jsonPreview = document.getElementById('jsonPreview');
    
    let abortController = null;

    function setFromSample() {
      try {
        const data = JSON.parse(sample);
        inputText.value = data.payload.text;
        maxHighlightsEl.value = data.payload.maxHighlights || 5;
        providerEl.value = data.config.provider;
        modelEl.value = data.config.model;
        temperatureEl.value = data.config.temperature || 0;
        updatePreview();
      } catch (_) {}
    }

    function updatePreview() {
      const req = buildRequest();
      jsonPreview.textContent = JSON.stringify(req, null, 2);
    }

    function buildRequest() {
      return {
        payload: {
          text: inputText.value.trim(),
          maxHighlights: Math.max(1, Number(maxHighlightsEl.value) || 5)
        },
        config: {
          provider: providerEl.value,
          model: modelEl.value.trim() || 'gpt-4.1',
          temperature: Number(temperatureEl.value) || 0
        }
      };
    }

    function escapeHtml(str) {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    const colorMap = {
      'Problem Identification': { bg: 'bg-rose-200', text: 'text-rose-900', pill: 'bg-rose-100 text-rose-800 border border-rose-200' },
      'Order Information': { bg: 'bg-green-200', text: 'text-green-900', pill: 'bg-green-100 text-green-800 border border-green-200' },
      'Root Cause Analysis': { bg: 'bg-amber-200', text: 'text-amber-900', pill: 'bg-amber-100 text-amber-800 border border-amber-200' },
      'Solution Implementation': { bg: 'bg-blue-200', text: 'text-blue-900', pill: 'bg-blue-100 text-blue-800 border border-blue-200' },
      'Additional Support': { bg: 'bg-purple-200', text: 'text-purple-900', pill: 'bg-purple-100 text-purple-800 border border-purple-200' }
    };

    function colorFor(label) {
      if (colorMap[label]) return colorMap[label];
      // deterministic fallback
      let hash = 0; for (let i = 0; i < label.length; i++) hash = ((hash << 5) - hash) + label.charCodeAt(i);
      const palette = [
        { bg: 'bg-cyan-200', text: 'text-cyan-900', pill: 'bg-cyan-100 text-cyan-800 border border-cyan-200' },
        { bg: 'bg-lime-200', text: 'text-lime-900', pill: 'bg-lime-100 text-lime-800 border border-lime-200' },
        { bg: 'bg-fuchsia-200', text: 'text-fuchsia-900', pill: 'bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200' },
        { bg: 'bg-teal-200', text: 'text-teal-900', pill: 'bg-teal-100 text-teal-800 border border-teal-200' },
        { bg: 'bg-sky-200', text: 'text-sky-900', pill: 'bg-sky-100 text-sky-800 border border-sky-200' }
      ];
      return palette[Math.abs(hash) % palette.length];
    }

    function applyHighlights(text, highlights) {
      if (!highlights || highlights.length === 0) return '<div class="text-gray-500 text-sm">No highlights to display</div>';
      // Render strictly as returned by API (assume valid, non-overlapping, ordered spans)
      let html = '';
      let cursor = 0;
      for (const h of highlights) {
        const s = h.char_start_position;
        const e = h.char_end_position;
        const label = String(h.label || 'Highlight');
        const desc = String(h.description || '');
        const color = colorFor(label);
        if (cursor < s) html += escapeHtml(text.slice(cursor, s));
        const segment = escapeHtml(text.slice(s, e));
        html += '<span class="highlight-span ' + color.bg + ' ' + color.text + '" title="' + escapeHtml(label) + ': ' + escapeHtml(desc) + '">' + segment + '</span>';
        cursor = e;
      }
      if (cursor < text.length) html += escapeHtml(text.slice(cursor));
      return html;
    }

    async function run() {
      const req = buildRequest();
      updatePreview();
      const headers = { 'Content-Type': 'application/json' };
      const token = tokenEl.value.trim();
      if (token) headers['Authorization'] = 'Bearer ' + token;

      // Create new AbortController for this request
      abortController = new AbortController();
      
      runBtn.classList.add('hidden');
      cancelBtn.classList.remove('hidden');
      
      try {
        const res = await fetch('/api/v1/highlighter', { 
          method: 'POST', 
          headers, 
          body: JSON.stringify(req),
          signal: abortController.signal
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error('Request failed: ' + res.status + ' ' + txt);
        }
        const data = await res.json();
        const highlights = (data?.highlights) || (data?.data?.highlights) || [];
        // Render text
        renderedText.innerHTML = applyHighlights(req.payload.text, highlights);
        // Render list
        highlightsList.innerHTML = highlights.map(h => {
          const c = colorFor(h.label || 'Highlight');
          return '<li class="p-3 bg-gray-50 border border-gray-200 rounded-lg">' +
            '<div class="flex items-center justify-between">' +
            '<span class="label-pill ' + c.pill + '">' + escapeHtml(String(h.label || 'Highlight')) + '</span>' +
            '<span class="text-xs text-gray-500 mono">[' + h.char_start_position + ', ' + h.char_end_position + ')</span>' +
            '</div>' +
            '<div class="text-gray-800 mt-1">' + escapeHtml(String(h.description || '')) + '</div>' +
          '</li>';
        }).join('');
        // Legend
        const counts = {};
        for (const h of highlights) counts[h.label || 'Highlight'] = (counts[h.label || 'Highlight'] || 0) + 1;
        labelLegend.innerHTML = Object.entries(counts).map(([label, count]) => { const c = colorFor(label); return '<span class="label-pill ' + c.pill + '">' + escapeHtml(label) + '<span class="text-gray-500">(' + count + ')</span></span>'; }).join('');
        // Usage - handle different response formats
        const usage = data?.usage || data?.data?.usage;
        if (usage) {
          usageInfo.classList.remove('hidden');
          const inputTokens = usage.input_tokens || usage.prompt_tokens || 0;
          const outputTokens = usage.output_tokens || usage.completion_tokens || 0;
          const totalTokens = usage.total_tokens || (inputTokens + outputTokens);
          
          usageInfo.innerHTML = '<div class="flex items-center gap-4 text-sm">' +
            '<span class="text-gray-500">Tokens:</span>' +
            '<span class="font-medium">Input: <span class="text-blue-600">' + inputTokens + '</span></span>' +
            '<span class="font-medium">Output: <span class="text-green-600">' + outputTokens + '</span></span>' +
            '<span class="font-medium">Total: <span class="text-purple-600">' + totalTokens + '</span></span>' +
            '</div>';
        } else {
          usageInfo.classList.add('hidden');
        }
        // Summary
        summaryLine.textContent = 'Conversation Analysis: ' + highlights.length + ' key highlights identified';
      } catch (err) {
        if (err.name === 'AbortError') {
          renderedText.innerHTML = '<div class="text-amber-600">Request cancelled by user</div>';
        } else {
          renderedText.innerHTML = '<div class="text-red-600">' + escapeHtml(err.message) + '</div>';
        }
        highlightsList.innerHTML = '';
        labelLegend.innerHTML = '';
        usageInfo.classList.add('hidden');
        usageInfo.innerHTML = '';
        summaryLine.textContent = '';
      } finally {
        runBtn.classList.remove('hidden');
        cancelBtn.classList.add('hidden');
        abortController = null;
      }
    }

    inputText.addEventListener('input', updatePreview);
    maxHighlightsEl.addEventListener('input', updatePreview);
    temperatureEl.addEventListener('input', updatePreview);
    providerEl.addEventListener('change', updatePreview);
    modelEl.addEventListener('input', updatePreview);

    runBtn.addEventListener('click', run);
    cancelBtn.addEventListener('click', () => {
      if (abortController) {
        abortController.abort();
      }
    });
    loadSampleBtn.addEventListener('click', () => setFromSample());

    // Load sample on first load
    setFromSample();
  </script>
</body>
</html>`

router.openapi(demoRoute, (c) => c.html(html))

export default {
  handler: router,
  mountPath: 'highlighter-demo'
}
