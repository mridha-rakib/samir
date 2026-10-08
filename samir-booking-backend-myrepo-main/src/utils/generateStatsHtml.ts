export const generateStatsHtml = (stats: any, initialLogs: any[] = []) => {
  const { uptime, memory, cpu, cache, process: procStats } = stats;

  const ramUsagePercent = parseFloat(memory.usagePercentage);
  const processHeapPercent = (parseFloat(procStats.memoryUsage.heapUsed) / parseFloat(procStats.memoryUsage.heapTotal) * 100).toFixed(2);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Samir Booking API - System Status</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #0f172a;
            --card-bg: rgba(30, 41, 59, 0.7);
            --primary: #38bdf8;
            --secondary: #818cf8;
            --accent: #f472b6;
            --text: #f1f5f9;
            --text-muted: #94a3b8;
            --border: rgba(255, 255, 255, 0.1);
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Outfit', sans-serif;
        }

        body {
            background: var(--bg);
            background-image: 
                radial-gradient(at 0% 0%, rgba(56, 189, 248, 0.15) 0px, transparent 50%),
                radial-gradient(at 100% 0%, rgba(129, 140, 248, 0.15) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(244, 114, 182, 0.15) 0px, transparent 50%),
                radial-gradient(at 0% 100%, rgba(56, 189, 248, 0.15) 0px, transparent 50%);
            color: var(--text);
            min-height: 100vh;
            padding: 2rem;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .container {
            width: 100%;
            max-width: 1200px;
        }

        header {
            text-align: center;
            margin-bottom: 3rem;
            animation: fadeInDown 0.8s ease-out;
        }

        h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            background: linear-gradient(to right, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .uptime-badge {
            display: inline-block;
            padding: 0.5rem 1rem;
            background: rgba(56, 189, 248, 0.1);
            border: 1px solid rgba(56, 189, 248, 0.2);
            border-radius: 100px;
            color: var(--primary);
            font-size: 0.9rem;
            font-weight: 600;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .card {
            background: var(--card-bg);
            backdrop-filter: blur(12px);
            border: 1px solid var(--border);
            border-radius: 1.5rem;
            padding: 2rem;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
            animation: fadeInUp 0.6s ease-out backwards;
        }

        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
            border-color: rgba(255, 255, 255, 0.2);
        }

        .card-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--text-muted);
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .card-title i {
            color: var(--primary);
        }

        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }

        .stat-sub {
            font-size: 0.9rem;
            color: var(--text-muted);
        }

        .progress-container {
            width: 100%;
            height: 8px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
            margin: 1.5rem 0;
            overflow: hidden;
        }

        .progress-bar {
            height: 100%;
            background: linear-gradient(to right, var(--primary), var(--secondary));
            border-radius: 4px;
            transition: width 1s ease-in-out;
        }

        .data-list {
            list-style: none;
        }

        .data-item {
            display: flex;
            justify-content: space-between;
            padding: 0.75rem 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .data-item:last-child {
            border-bottom: none;
        }

        .label {
            color: var(--text-muted);
        }

        .value {
            font-weight: 600;
            color: var(--text);
        }

        footer {
            margin-top: auto;
            padding: 2rem;
            text-align: center;
            color: var(--text-muted);
            font-size: 0.9rem;
        }

        .refresh-button {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            width: 50px;
            height: 50px;
            border-radius: 25px;
            background: var(--primary);
            border: none;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(56, 189, 248, 0.4);
            transition: all 0.3s ease;
        }

        .refresh-button:hover {
            transform: rotate(180deg) scale(1.1);
        }

        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: var(--success);
            display: inline-block;
            margin-right: 0.5rem;
            box-shadow: 0 0 10px var(--success);
        }

        /* Animations for each card delay */
        .card:nth-child(1) { animation-delay: 0.1s; }
        .card:nth-child(2) { animation-delay: 0.2s; }
        .card:nth-child(3) { animation-delay: 0.3s; }
        .card:nth-child(4) { animation-delay: 0.4s; }

        /* Terminal Styles */
        .terminal-card {
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid rgba(56, 189, 248, 0.2);
            border-radius: 1.5rem;
            padding: 2rem;
            margin-top: 2rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(16px);
            animation: fadeInUp 0.8s ease-out;
        }

        .terminal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 1rem;
            margin-bottom: 1rem;
        }

        .terminal-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--primary);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .terminal-actions {
            display: flex;
            gap: 1rem;
            align-items: center;
        }

        .terminal-btn {
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: var(--danger);
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .terminal-btn:hover {
            background: rgba(239, 68, 68, 0.3);
            transform: translateY(-1px);
        }

        .terminal-status-indicator {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            color: var(--text-muted);
        }

        .terminal-pulse {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--success);
            box-shadow: 0 0 8px var(--success);
            animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .terminal-body {
            background: #090d16;
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 0.75rem;
            font-family: 'Consolas', 'Courier New', monospace;
            padding: 1.25rem;
            height: 450px;
            overflow-y: auto;
            color: #a9b1d6;
            font-size: 0.9rem;
            line-height: 1.5;
            box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.8);
        }

        /* Custom Scrollbar for Terminal */
        .terminal-body::-webkit-scrollbar {
            width: 8px;
        }
        .terminal-body::-webkit-scrollbar-track {
            background: #090d16;
            border-radius: 0.75rem;
        }
        .terminal-body::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
        }
        .terminal-body::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.25);
        }

        .terminal-placeholder {
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: var(--text-muted);
            text-align: center;
            font-family: 'Outfit', sans-serif;
            gap: 0.5rem;
        }

        .log-entry {
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);
            padding: 0.75rem 0;
            display: flex;
            flex-direction: column;
            animation: fadeIn 0.3s ease-out;
        }

        .log-entry:last-child {
            border-bottom: none;
        }

        .log-header {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.75rem;
            cursor: pointer;
            user-select: none;
            padding: 0.25rem;
            border-radius: 0.25rem;
            transition: background 0.2s ease;
        }

        .log-header:hover {
            background: rgba(255, 255, 255, 0.03);
        }

        .log-arrow {
            display: inline-block;
            font-size: 0.7rem;
            transition: transform 0.2s ease;
            color: var(--text-muted);
        }

        .log-arrow.rotated {
            transform: rotate(90deg);
            color: var(--primary);
        }

        .log-time {
            color: #565f89;
        }

        .log-method {
            font-weight: 700;
            padding: 0.1rem 0.4rem;
            border-radius: 0.25rem;
            font-size: 0.8rem;
        }

        .method-get { background: rgba(56, 189, 248, 0.1); color: var(--primary); }
        .method-post { background: rgba(16, 185, 129, 0.1); color: var(--success); }
        .method-put { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
        .method-patch { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
        .method-delete { background: rgba(239, 68, 68, 0.1); color: var(--danger); }

        .log-url {
            color: #c0caf5;
            word-break: break-all;
            flex-grow: 1;
        }

        .log-status {
            font-weight: 600;
            font-size: 0.85rem;
        }

        .status-2xx { color: var(--success); }
        .status-4xx { color: var(--warning); }
        .status-5xx { color: var(--danger); }

        .log-duration {
            color: #737aa2;
            font-size: 0.85rem;
        }

        .log-details {
            display: none;
            padding: 0.75rem 1rem 0.5rem 1.75rem;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 0.5rem;
            margin-top: 0.5rem;
            border-left: 2px solid var(--primary);
        }

        .log-details.open {
            display: block;
        }

        .log-details-section {
            margin-bottom: 0.75rem;
        }

        .log-details-section:last-child {
            margin-bottom: 0;
        }

        .log-details-label {
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            color: var(--secondary);
            margin-bottom: 0.25rem;
            display: block;
        }

        .log-details-label.error {
            color: var(--danger);
        }

        .log-details pre {
            background: #0f1422;
            border: 1px solid rgba(255, 255, 255, 0.03);
            border-radius: 0.375rem;
            padding: 0.75rem;
            white-space: pre-wrap;
            word-break: break-all;
            color: #9ece6a;
            font-size: 0.85rem;
            max-height: 250px;
            overflow-y: auto;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
        }

    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Samir Booking API</h1>
            <div class="uptime-badge">
                <span class="status-dot"></span>
                Active: ${uptime}
            </div>
        </header>

        <div class="grid">
            <!-- Memory Card -->
            <div class="card">
                <div class="card-title">💾 System Memory</div>
                <div class="stat-value">${ramUsagePercent}%</div>
                <div class="stat-sub">${memory.used} / ${memory.total}</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${ramUsagePercent}%"></div>
                </div>
                <ul class="data-list">
                    <li class="data-item">
                        <span class="label">Free</span>
                        <span class="value">${memory.free}</span>
                    </li>
                </ul>
            </div>

            <!-- CPU Card -->
            <div class="card">
                <div class="card-title">⚙️ CPU Info</div>
                <div class="stat-value">${cpu.cores} Cores</div>
                <div class="stat-sub">${cpu.model}</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${cpu.loadAverage[0] * 10}%"></div>
                </div>
                <ul class="data-list">
                    <li class="data-item">
                        <span class="label">Load (1m)</span>
                        <span class="value">${cpu.loadAverage[0]}</span>
                    </li>
                    <li class="data-item">
                        <span class="label">Load (5m)</span>
                        <span class="value">${cpu.loadAverage[1]}</span>
                    </li>
                </ul>
            </div>

            <!-- Process Card -->
            <div class="card">
                <div class="card-title">🚀 Node Process</div>
                <div class="stat-value">${procStats.memoryUsage.rss}</div>
                <div class="stat-sub">RSS Memory Usage</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${processHeapPercent}%"></div>
                </div>
                <ul class="data-list">
                    <li class="data-item">
                        <span class="label">Heap Used</span>
                        <span class="value">${procStats.memoryUsage.heapUsed}</span>
                    </li>
                    <li class="data-item">
                        <span class="label">Heap Total</span>
                        <span class="value">${procStats.memoryUsage.heapTotal}</span>
                    </li>
                </ul>
            </div>

            <!-- Cache Card -->
            <div class="card">
                <div class="card-title">⚡ Cache Performance</div>
                <div class="stat-value">${cache.keys} Keys</div>
                <div class="stat-sub">Memory Cache Status</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${cache.keys > 0 ? (cache.hits / (cache.hits + cache.misses + 0.1) * 100) : 0}%"></div>
                </div>
                <ul class="data-list">
                    <li class="data-item">
                        <span class="label">Hits</span>
                        <span class="value" style="color: var(--success)">${cache.hits}</span>
                    </li>
                    <li class="data-item">
                        <span class="label">Misses</span>
                        <span class="value" style="color: var(--danger)">${cache.misses}</span>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Live Terminal Card -->
        <div class="terminal-card">
            <div class="terminal-header">
                <div class="terminal-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
                    Live API Logs (Terminal)
                </div>
                <div class="terminal-actions">
                    <div class="terminal-status-indicator">
                        <span class="terminal-pulse"></span>
                        <span>Listening...</span>
                    </div>
                    <button id="clear-btn" class="terminal-btn">Clear Logs</button>
                </div>
            </div>
            <div class="terminal-body" id="terminal">
                <div class="terminal-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted)"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
                    <div style="margin-top: 0.5rem">No logs recorded yet.</div>
                    <div style="font-size: 0.8rem">Hit any API endpoint under /api/v1/ to view live logging.</div>
                </div>
            </div>
        </div>

        <footer>
            Built with ❤️ for Samir Booking &copy; ${new Date().getFullYear()}
        </footer>
    </div>

    <button class="refresh-button" onclick="window.location.reload()">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
    </button>

    <script>
        const terminal = document.getElementById('terminal');
        const clearBtn = document.getElementById('clear-btn');
        const expandedLogIds = new Set();
        
        // Pass initial logs from backend to avoid waiting for polling
        const initialLogs = ${JSON.stringify(initialLogs)};
        
        function renderLogs(logs) {
            if (!logs || logs.length === 0) {
                terminal.innerHTML = \`
                    <div class="terminal-placeholder">
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted)"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
                        <div style="margin-top: 0.5rem">No logs recorded yet.</div>
                        <div style="font-size: 0.8rem">Hit any API endpoint under /api/v1/ to view live logging.</div>
                    </div>
                \`;
                return;
            }

            const html = logs.map(log => {
                const statusClass = log.status >= 500 ? 'status-5xx' : log.status >= 400 ? 'status-4xx' : 'status-2xx';
                const methodClass = \`method-\${log.method.toLowerCase()}\`;
                const time = new Date(log.timestamp).toLocaleTimeString();
                const isExpanded = expandedLogIds.has(log.id);
                const arrowClass = isExpanded ? 'log-arrow rotated' : 'log-arrow';
                const detailsClass = isExpanded ? 'log-details open' : 'log-details';

                let detailsHtml = '';
                if (log.query && Object.keys(log.query).length > 0) {
                    detailsHtml += \`
                        <div class="log-details-section">
                            <span class="log-details-label">Query Parameters:</span>
                            <pre>\${JSON.stringify(log.query, null, 2)}</pre>
                        </div>
                    \`;
                }
                if (log.body && Object.keys(log.body).length > 0) {
                    detailsHtml += \`
                        <div class="log-details-section">
                            <span class="log-details-label">Request Body:</span>
                            <pre>\${JSON.stringify(log.body, null, 2)}</pre>
                        </div>
                    \`;
                }
                if (log.responseBody) {
                    detailsHtml += \`
                        <div class="log-details-section">
                            <span class="log-details-label">Response Payload:</span>
                            <pre>\${JSON.stringify(log.responseBody, null, 2)}</pre>
                        </div>
                    \`;
                }
                if (log.error) {
                    detailsHtml += \`
                        <div class="log-details-section">
                            <span class="log-details-label error">Error:</span>
                            <pre>\${JSON.stringify(log.error, null, 2)}</pre>
                        </div>
                    \`;
                }

                if (!detailsHtml) {
                    detailsHtml = \`
                        <div class="log-details-section">
                            <span class="log-details-label">Payload:</span>
                            <pre>No query, request body, or response payload.</pre>
                        </div>
                    \`;
                }

                return \`
                    <div class="log-entry" id="log-\${log.id}">
                        <div class="log-header" onclick="toggleDetails('\${log.id}')">
                            <span class="\${arrowClass}">▶</span>
                            <span class="log-time">[\${time}]</span>
                            <span class="log-method \${methodClass}">\${log.method}</span>
                            <span class="log-url">\${log.url}</span>
                            <span class="log-status \${statusClass}">\${log.status || 'PENDING'}</span>
                            <span class="log-duration">\${log.duration ? log.duration + 'ms' : ''}</span>
                        </div>
                        <div class="\${detailsClass}" id="details-\${log.id}">
                            \${detailsHtml}
                        </div>
                    </div>
                \`;
            }).join('');

            terminal.innerHTML = html;
        }

        window.toggleDetails = function(id) {
            const el = document.getElementById(\`details-\${id}\`);
            const arrow = document.querySelector(\`#log-\${id} .log-arrow\`);
            if (el) {
                if (el.classList.contains('open')) {
                    el.classList.remove('open');
                    arrow.classList.remove('rotated');
                    expandedLogIds.delete(id);
                } else {
                    el.classList.add('open');
                    arrow.classList.add('rotated');
                    expandedLogIds.add(id);
                }
            }
        };

        async function fetchLogs() {
            try {
                const res = await fetch('/api/v1/terminal-logs');
                if (!res.ok) return;
                const logs = await res.json();
                renderLogs(logs);
            } catch (err) {
                console.error('Failed to fetch logs:', err);
            }
        }

        clearBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to clear all logs?')) {
                try {
                    await fetch('/api/v1/terminal-logs', { method: 'DELETE' });
                    fetchLogs();
                } catch (err) {
                    console.error('Failed to clear logs:', err);
                }
            }
        });

        // Initialize
        renderLogs(initialLogs);

        // Poll every 2 seconds
        setInterval(fetchLogs, 2000);
    </script>
</body>
</html>
  `;
};
