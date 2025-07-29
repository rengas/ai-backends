import { OpenAPIHono, createRoute } from "@hono/zod-openapi";

const router = new OpenAPIHono();

const jsonEditorRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      description: "Returns the AI Backend JSON editor interface for testing API payloads.",
      content: {
        "text/html": {
          schema: {
            type: "string"
          }
        },
      },
    },
  },
  tags: ["Tools"],
});

const jsonEditorHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Backends JSON Editor - API Testing Tool</title>
    <script src="https://unpkg.com/jsoneditor@10.1.0/dist/jsoneditor.min.js"></script>
    <link href="https://unpkg.com/jsoneditor@10.1.0/dist/jsoneditor.min.css" rel="stylesheet" type="text/css">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 2em;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .editor-container {
            display: flex;
            gap: 20px;
            height: 600px;
        }
        .editor-panel {
            flex: 1;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .panel-header {
            background: #f8f9fa;
            padding: 15px;
            border-bottom: 1px solid #e9ecef;
            font-weight: 600;
            color: #495057;
        }
        .editor-wrapper {
            height: calc(100% - 60px);
            padding: 0;
        }
        #jsoneditor, #jsoneditor2 {
            height: 100%;
        }
        .controls {
            margin: 20px 0;
            text-align: center;
        }
        .btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            margin: 0 10px;
            transition: all 0.3s ease;
        }
        .btn:hover {
            background: #5a67d8;
            transform: translateY(-1px);
        }
        .btn-secondary {
            background: #6c757d;
        }
        .btn-secondary:hover {
            background: #5a6268;
        }
        .links {
            margin-top: 20px;
            text-align: center;
        }
        .links a {
            color: #667eea;
            text-decoration: none;
            margin: 0 15px;
            font-weight: 500;
        }
        .links a:hover {
            text-decoration: underline;
        }
        @media (max-width: 768px) {
            .editor-container {
                flex-direction: column;
                height: auto;
            }
            .editor-panel {
                height: 400px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>AI Backends JSON Editor</h1>
            <p>Edit, validate, and format JSON payloads for testing your AI Backend API endpoints</p>
        </div>

        <div class="editor-container">
            <div class="editor-panel">
                <div class="panel-header">📝 JSON Input Editor</div>
                <div class="editor-wrapper">
                    <div id="jsoneditor"></div>
                </div>
            </div>
            <div class="editor-panel">
                <div class="panel-header">🎯 Formatted Output</div>
                <div class="editor-wrapper">
                    <div id="jsoneditor2"></div>
                </div>
            </div>
        </div>

        <div class="controls">
            <button class="btn" onclick="copyToOutput()">Copy to Output →</button>
            <button class="btn" onclick="validateJSON()">✓ Validate</button>
            <button class="btn" onclick="formatJSON()">🎨 Format</button>
            <button class="btn" onclick="minifyJSON()">📦 Minify</button>
            <button class="btn btn-secondary" onclick="clearEditors()">🗑 Clear</button>
        </div>

        <div class="links">
            <a href="/api/doc" target="_blank">📖 API Documentation</a>
            <a href="/" target="_blank">🏠 Home</a>
            <a href="https://github.com/josdejong/jsoneditor" target="_blank">ℹ️ About JSONEditor</a>
        </div>

        <div class="license-info" style="margin-top: 30px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <details style="padding: 20px;">
                <summary style="cursor: pointer; font-weight: 600; color: #495057; font-size: 1.1em; outline: none; user-select: none;">
                    📄 License Information
                    <span style="font-weight: normal; font-size: 0.9em; color: #6c757d; margin-left: 10px;">(click to expand)</span>
                </summary>
                <div style="margin-top: 15px; background: #f8f9fa; padding: 15px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.6; color: #495057;">
                    <strong>JSONEditor</strong> by Jos de Jong<br>
                    Copyright © 2011-2024 Jos de Jong<br><br>
                    
                    Licensed under the <strong>Apache License, Version 2.0</strong><br>
                    You may obtain a copy of the License at:<br>
                    <a href="http://www.apache.org/licenses/LICENSE-2.0" target="_blank" style="color: #667eea; text-decoration: none;">http://www.apache.org/licenses/LICENSE-2.0</a><br><br>
                    
                    Unless required by applicable law or agreed to in writing, software<br>
                    distributed under the License is distributed on an "AS IS" BASIS,<br>
                    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.<br>
                    See the License for the specific language governing permissions and<br>
                    limitations under the License.<br><br>
                    
                    🔗 <a href="https://github.com/josdejong/jsoneditor/blob/master/LICENSE" target="_blank" style="color: #667eea; text-decoration: none;">View Full License on GitHub</a>
                </div>
            </details>
        </div>
    </div>

    <script>
        // Initialize JSON editors
        const container1 = document.getElementById('jsoneditor');
        const container2 = document.getElementById('jsoneditor2');
        
        const options1 = {
            mode: 'code',
            modes: ['code', 'tree', 'form', 'text', 'view'],
            theme: 'ace/theme/textmate',
            indentation: 2
        };
        
        const options2 = {
            mode: 'tree',
            modes: ['tree', 'code', 'form', 'text', 'view'],
            theme: 'ace/theme/textmate',
            indentation: 2
        };

        const editor1 = new JSONEditor(container1, options1);
        const editor2 = new JSONEditor(container2, options2);

        // Set initial example data
        const exampleData = {
            "message": "Analyze this text for sentiment",
            "text": "I love using this AI backend for my applications!",
            "model": "claude-3-sonnet",
            "options": {
                "temperature": 0.7,
                "max_tokens": 1000,
                "stream": false
            },
            "metadata": {
                "timestamp": new Date().toISOString(),
                "user_id": "user_123",
                "request_id": "req_" + Math.random().toString(36).substr(2, 9)
            }
        };
        
        editor1.set(exampleData);
        editor2.set(exampleData);

        function copyToOutput() {
            try {
                const json = editor1.get();
                editor2.set(json);
                showMessage('✅ JSON copied to output panel', 'success');
            } catch (error) {
                showMessage('❌ Invalid JSON: ' + error.message, 'error');
            }
        }

        function validateJSON() {
            try {
                const json = editor1.get();
                showMessage('✅ JSON is valid!', 'success');
            } catch (error) {
                showMessage('❌ Invalid JSON: ' + error.message, 'error');
            }
        }

        function formatJSON() {
            try {
                const json = editor1.get();
                editor1.set(json);
                showMessage('✅ JSON formatted successfully', 'success');
            } catch (error) {
                showMessage('❌ Cannot format invalid JSON: ' + error.message, 'error');
            }
        }

        function minifyJSON() {
            try {
                const json = editor1.get();
                const minified = JSON.stringify(json);
                editor1.setText(minified);
                showMessage('✅ JSON minified successfully', 'success');
            } catch (error) {
                showMessage('❌ Cannot minify invalid JSON: ' + error.message, 'error');
            }
        }

        function clearEditors() {
            if (confirm('Are you sure you want to clear both editors?')) {
                editor1.set({});
                editor2.set({});
                showMessage('🗑 Editors cleared', 'info');
            }
        }

        function showMessage(message, type) {
            // Create and show a temporary message
            const messageDiv = document.createElement('div');
            messageDiv.textContent = message;
            messageDiv.style.cssText = \`
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 6px;
                color: white;
                font-weight: 500;
                z-index: 1000;
                transition: all 0.3s ease;
                \${type === 'success' ? 'background: #28a745;' : 
                  type === 'error' ? 'background: #dc3545;' : 
                  'background: #17a2b8;'}
            \`;
            
            document.body.appendChild(messageDiv);
            
            setTimeout(() => {
                messageDiv.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(messageDiv);
                }, 300);
            }, 3000);
        }

        // Add keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'Enter':
                        e.preventDefault();
                        copyToOutput();
                        break;
                    case 'l':
                        e.preventDefault();
                        formatJSON();
                        break;
                    case 'm':
                        e.preventDefault();
                        minifyJSON();
                        break;
                }
            }
        });

        // Add tooltips for keyboard shortcuts
        document.querySelector('.controls').innerHTML += \`
            <div style="margin-top: 15px; font-size: 12px; color: #6c757d;">
                💡 Shortcuts: Ctrl+Enter (Copy), Ctrl+L (Format), Ctrl+M (Minify)
            </div>
        \`;
    </script>
</body>
</html>
`;

router.openapi(jsonEditorRoute, (c) => {
  return c.html(jsonEditorHTML);
});

export default {
  handler: router,
  mountPath: 'jsoneditor'
}; 