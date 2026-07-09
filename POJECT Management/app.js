
const defaultProjects = [
    { id: 1, name: "🌐 Portfolio Website", progress: 80, priority: "🔴 High", status: "🟢 In Progress", color: "var(--danger)", priorityColor: "rgba(239, 68, 68, 0.2)", pTextCol: "var(--danger)" },
    { id: 2, name: "☁️ Weather App",        progress: 45, priority: "🟡 Medium", status: "🟡 Ongoing",     color: "var(--warning)", priorityColor: "rgba(245, 158, 11, 0.2)", pTextCol: "var(--warning)" },
    { id: 3, name: "🎓 College ERP",        progress: 20, priority: "🟢 Low",    status: "🔵 Planning",   color: "var(--success)", priorityColor: "rgba(16, 185, 129, 0.2)", pTextCol: "var(--success)" }
];


const defaultTasks = [
    { id: 1, projectId: 1, text: "Design Homepage",     completed: true  },
    { id: 2, projectId: 1, text: "Setup GitHub Repo",   completed: false },
    { id: 3, projectId: 2, text: "Fetch API Data",      completed: false },
    { id: 4, projectId: 3, text: "Plan DB Schema",      completed: false }
];

// ─── State ──────────────────────────────────────────────────────
let projects = JSON.parse(localStorage.getItem('pf_projects')) || defaultProjects;
let tasks    = JSON.parse(localStorage.getItem('pf_tasks'))    || defaultTasks;

function saveState() {
    localStorage.setItem('pf_projects', JSON.stringify(projects));
    localStorage.setItem('pf_tasks',    JSON.stringify(tasks));
    renderDashboard();
}

// ─── Render ──────────────────────────────────────────────────────
function renderDashboard() {
    renderProjects();
    renderAllTasks();
    updateStats();
    renderGraph();
}

// Calculate project progress from completed tasks
function getProgress(projectId) {
    const ptasks = tasks.filter(t => t.projectId === projectId);
    if (ptasks.length === 0) return 0;
    return Math.round((ptasks.filter(t => t.completed).length / ptasks.length) * 100);
}

function renderProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    if (projects.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:2rem;">No projects yet. Add one!</p>';
        return;
    }

    container.innerHTML = projects.map(p => {
        const projectTasks   = tasks.filter(t => t.projectId === p.id);
        const completedCount = projectTasks.filter(t => t.completed).length;
        const totalCount     = projectTasks.length;
        const progress       = getProgress(p.id);

        const noTasksHtml = `
            <div style="margin-top:0.75rem;padding:0.75rem;background:rgba(255,255,255,0.03);border-radius:8px;border:1px dashed rgba(255,255,255,0.1);text-align:center;">
                <span style="color:var(--text-secondary);font-size:0.82rem;">⚠️ No tasks yet — add a task to track progress</span>
            </div>`;

        const tasksHtml = projectTasks.length === 0 ? noTasksHtml
            : `<ul style="list-style:none;margin-top:0.75rem;display:flex;flex-direction:column;gap:0.4rem;">
                ${projectTasks.map(t => `
                    <li style="display:flex;align-items:center;gap:0.6rem;font-size:0.85rem;">
                        <input type="checkbox" class="task-checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTask(${t.id})">
                        <span class="task-text ${t.completed ? 'completed' : ''}">${t.text}</span>
                        <button onclick="deleteTask(${t.id})" class="delete-btn" style="margin-left:auto;font-size:0.8rem;" title="Delete">🗑</button>
                    </li>`).join('')}
               </ul>`;

        return `
        <div class="project-card">
            <div class="project-top">
                <div class="project-title">${p.name}</div>
                <div style="display:flex;align-items:center;gap:0.75rem;font-weight:bold;color:${p.color};">
                    ${totalCount === 0 ? '<span style="font-size:0.75rem;color:var(--text-secondary);">Add tasks</span>' : progress + '%'}
                    <button class="delete-btn" onclick="deleteProject(${p.id})" title="Delete Project">🗑</button>
                </div>
            </div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width:${progress}%;background-color:${p.color};"></div>
            </div>
            <div class="project-meta">
                <div>Priority: <span class="badge" style="background:${p.priorityColor};color:${p.pTextCol};">${p.priority}</span></div>
                <div>Status: ${p.status}</div>
                <div style="color:var(--text-secondary);">Tasks: ${completedCount}/${totalCount} done</div>
            </div>
            <div class="project-tasks">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:1rem;">
                    <span style="font-size:0.85rem;color:var(--text-secondary);font-weight:600;">Tasks</span>
                    <button class="btn btn-secondary" style="width:auto;padding:0.3rem 0.75rem;font-size:0.75rem;margin-bottom:0;" onclick="openTaskModalForProject(${p.id})">+ Add Task</button>
                </div>
                ${tasksHtml}
            </div>
        </div>`;
    }).join('');
}

function renderAllTasks() {
    const allTasksList = document.getElementById('all-tasks-list');
    if (!allTasksList) return;

    if (tasks.length === 0) {
        allTasksList.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:1rem;">No tasks yet.</p>';
        return;
    }

    // Group tasks by project
    let html = '';
    projects.forEach(p => {
        const projectTasks = tasks.filter(t => t.projectId === p.id);
        if (projectTasks.length === 0) return;
        html += `
            <li style="list-style:none;">
                <div style="font-weight:600;color:${p.color};margin-bottom:0.5rem;padding:0.5rem 0;border-bottom:1px solid rgba(255,255,255,0.07);">${p.name}</div>
                <ul style="list-style:none;display:flex;flex-direction:column;gap:0.4rem;margin-bottom:1rem;">
                    ${projectTasks.map(t => `
                        <li class="task-item">
                            <div class="task-checkbox-group">
                                <input type="checkbox" class="task-checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTask(${t.id})">
                                <span class="task-text ${t.completed ? 'completed' : ''}">${t.text}</span>
                            </div>
                            <button class="delete-btn" style="font-size:1rem;" onclick="deleteTask(${t.id})" title="Delete">🗑</button>
                        </li>`).join('')}
                </ul>
            </li>`;
    });

    // Orphan tasks (no matching project)
    const orphans = tasks.filter(t => !projects.find(p => p.id === t.projectId));
    if (orphans.length > 0) {
        html += `<li style="list-style:none;">
            <div style="font-weight:600;color:var(--text-secondary);margin-bottom:0.5rem;">Unassigned</div>
            <ul style="list-style:none;display:flex;flex-direction:column;gap:0.4rem;">
                ${orphans.map(t => `
                    <li class="task-item">
                        <div class="task-checkbox-group">
                            <input type="checkbox" class="task-checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTask(${t.id})">
                            <span class="task-text ${t.completed ? 'completed' : ''}">${t.text}</span>
                        </div>
                        <button class="delete-btn" style="font-size:1rem;" onclick="deleteTask(${t.id})">🗑</button>
                    </li>`).join('')}
            </ul>
        </li>`;
    }

    allTasksList.innerHTML = html || '<p style="color:var(--text-secondary);text-align:center;padding:1rem;">No tasks yet.</p>';
}

function updateStats() {
    const totalProjects  = projects.length;
    const totalTasks     = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks   = totalTasks - completedTasks;

    let avgProgress = 0;
    if (totalProjects > 0) {
        avgProgress = Math.round(projects.reduce((s, p) => s + getProgress(p.id), 0) / totalProjects);
    }

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    set('stat-projects',  totalProjects);
    set('stat-tasks',     totalTasks);
    set('stat-completed', completedTasks);
    set('stat-pending',   pendingTasks);

    // SVG segmented ring — circumference of r=82 is ~515
    const circumference = 2 * Math.PI * 82; // ≈ 515.2
    const filled = (avgProgress / 100) * circumference;
    const ringFg = document.getElementById('ring-fg');
    if (ringFg) ringFg.setAttribute('stroke-dasharray', `${filled} ${circumference - filled}`);
    const ringPct = document.getElementById('ring-percent');
    if (ringPct) ringPct.textContent = `${avgProgress}%`;

    set('progress-completed-text', `Completed: ${completedTasks} Tasks`);
    set('progress-pending-text',   `Pending: ${pendingTasks} Tasks`);
}

function renderGraph() {
    const graphContainer = document.getElementById('projects-graph');
    if (!graphContainer) return;

    if (projects.length === 0) {
        graphContainer.innerHTML = '<p style="color:var(--text-secondary);text-align:center;">No projects to show.</p>';
        return;
    }

    graphContainer.innerHTML = projects.map(p => {
        const progress = getProgress(p.id);
        
        // Gradient based on priority to mimic the colorful bars
        let grad;
        if (p.priority.includes('High')) grad = 'linear-gradient(to top, #f72585, #7209b7)';
        else if (p.priority.includes('Medium')) grad = 'linear-gradient(to top, #f59e0b, #f13c20)';
        else grad = 'linear-gradient(to top, #4361ee, #4cc9f0)';

        // Extracted just the text part of the name for cleaner labels
        const cleanName = p.name.replace(/[^a-zA-Z0-9\s]/g, '').trim();

        return `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
            <div style="width: 48px; height: 220px; border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; padding: 4px; position: relative; display: flex; flex-direction: column; justify-content: flex-end; background: rgba(0,0,0,0.2);">
                
                <!-- Dark segments bg -->
                <div style="position: absolute; top: 4px; bottom: 4px; left: 4px; right: 4px; background: repeating-linear-gradient(to bottom, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 8px, transparent 8px, transparent 12px);"></div>
                
                <!-- Filled segments -->
                <div style="width: 100%; height: ${progress}%; position: relative; z-index: 2; transition: height 1.2s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden;">
                    <!-- The gradient is fixed to the bottom so it fills up properly -->
                    <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 210px; background: ${grad}; -webkit-mask-image: repeating-linear-gradient(to bottom, black 0px, black 8px, transparent 8px, transparent 12px); mask-image: repeating-linear-gradient(to bottom, black 0px, black 8px, transparent 8px, transparent 12px);"></div>
                </div>

                <!-- Percentage Label -->
                <div style="position: absolute; bottom: calc(${progress}% + 8px); left: -10px; right: -10px; text-align: center; font-size: 0.85rem; font-weight: 700; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.8); z-index: 3;">
                    ${progress}%
                </div>
            </div>
            <!-- Project Name -->
            <div style="font-size: 0.75rem; color: var(--text-secondary); text-align: center; width: 65px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${cleanName}">
                ${cleanName}
            </div>
        </div>`;
    }).join('');
}

// ─── Actions ─────────────────────────────────────────────────────
function deleteProject(id) {
    if (confirm('Delete this project and all its tasks?')) {
        projects = projects.filter(p => p.id !== id);
        tasks    = tasks.filter(t => t.projectId !== id);
        saveState();
        showToast('Project deleted');
    }
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) { task.completed = !task.completed; saveState(); }
}

function deleteTask(id) {
    if (confirm('Delete this task?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveState();
    }
}

// ─── Modals ──────────────────────────────────────────────────────
function openProjectModal() {
    const modal = document.getElementById('project-modal');
    if (modal) modal.classList.add('active');
}

function openTaskModal() {
    populateProjectDropdown(null);
    const modal = document.getElementById('task-modal');
    if (modal) modal.classList.add('active');
}

function openTaskModalForProject(projectId) {
    populateProjectDropdown(projectId);
    const modal = document.getElementById('task-modal');
    if (modal) modal.classList.add('active');
}

function populateProjectDropdown(selectedId) {
    const select = document.getElementById('task-project');
    if (!select) return;
    select.innerHTML = projects.map(p =>
        `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${p.name}</option>`
    ).join('');
    if (projects.length === 0) {
        select.innerHTML = '<option disabled selected>No projects yet</option>';
    }
}

function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}

// ─── Form Submissions ────────────────────────────────────────────
document.getElementById('project-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const priorityVal = document.getElementById('proj-priority').value;

    let color = "var(--accent-primary)", priorityColor = "rgba(59,130,246,0.2)", pTextCol = "var(--accent-primary)";
    if (priorityVal.includes("High"))   { color = "var(--danger)";  priorityColor = "rgba(239,68,68,0.2)";    pTextCol = "var(--danger)"; }
    else if (priorityVal.includes("Medium")) { color = "var(--warning)"; priorityColor = "rgba(245,158,11,0.2)"; pTextCol = "var(--warning)"; }
    else                                { color = "var(--success)"; priorityColor = "rgba(16,185,129,0.2)";  pTextCol = "var(--success)"; }

    projects.unshift({
        id: Date.now(),
        name:     document.getElementById('proj-name').value,
        priority: priorityVal,
        status:   document.getElementById('proj-status').value,
        color, priorityColor, pTextCol
    });
    saveState();
    closeModals();
    e.target.reset();
    showToast('Project added!');
});

document.getElementById('task-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const projectIdVal = parseInt(document.getElementById('task-project').value);
    if (!projects.find(p => p.id === projectIdVal)) {
        showToast('Please add a project first!');
        return;
    }
    tasks.unshift({
        id:        Date.now(),
        projectId: projectIdVal,
        text:      document.getElementById('task-name').value,
        completed: false
    });
    saveState();
    closeModals();
    e.target.reset();
    showToast('Task added!');
});

// ─── Init ────────────────────────────────────────────────────────
renderDashboard();

// ─── Sidebar Navigation ──────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function () {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        this.classList.add('active');

        const text = this.innerText.replace(/[^\w\s]/gi, '').trim().toLowerCase();
        document.querySelectorAll('.view-section').forEach(v => v.style.display = 'none');
        const target = document.getElementById(`view-${text}`);
        if (target) target.style.display = 'block';
    });
});

// ─── Theme ───────────────────────────────────────────────────────
let isDarkMode = localStorage.getItem('pf_theme') !== 'light';

function initTheme() {
    if (!isDarkMode) {
        document.body.setAttribute('data-theme', 'light');
        const btn = document.getElementById('theme-toggle');
        if (btn) btn.innerText = '🌙 Dark Mode';
    }
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    const btn = document.getElementById('theme-toggle');
    if (isDarkMode) {
        document.body.removeAttribute('data-theme');
        if (btn) btn.innerText = '☀️ Light Mode';
        localStorage.setItem('pf_theme', 'dark');
        showToast('Dark mode enabled!');
    } else {
        document.body.setAttribute('data-theme', 'light');
        if (btn) btn.innerText = '🌙 Dark Mode';
        localStorage.setItem('pf_theme', 'light');
        showToast('Light mode enabled!');
    }
}
initTheme();

// ─── Toast ───────────────────────────────────────────────────────
function showToast(message) {
    let toast = document.getElementById('pf-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'pf-toast';
        toast.style.cssText = `
            position:fixed;bottom:30px;right:30px;
            background:linear-gradient(135deg,var(--accent-primary),var(--accent-secondary));
            color:white;padding:1rem 2rem;border-radius:12px;
            box-shadow:0 10px 30px rgba(0,0,0,0.3);z-index:9999;
            transform:translateY(150px) scale(0.9);opacity:0;
            transition:all 0.4s cubic-bezier(0.175,0.885,0.32,1.275);font-weight:500;`;
        document.body.appendChild(toast);
    }
    toast.innerText = message;
    setTimeout(() => { toast.style.transform = 'translateY(0) scale(1)'; toast.style.opacity = '1'; }, 10);
    setTimeout(() => { toast.style.transform = 'translateY(150px) scale(0.9)'; toast.style.opacity = '0'; }, 3000);
}
