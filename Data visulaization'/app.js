let studentsData = [];
let charts = {};
let isDarkMode = true;
let currentView = 'view-overview';
let selectedStudentId = null;

document.addEventListener("DOMContentLoaded", () => {
    fetchData();

    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterData(e.target.value);
    });

    document.body.setAttribute('data-theme', 'dark');

    document.getElementById('themeToggle').addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
        const icon = document.querySelector('#themeToggle i');
        icon.className = isDarkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon';

        if (currentView === 'view-overview') {
            updateDashboard(studentsData, true);
        }
    });

    document.getElementById('exportBtn').addEventListener('click', () => {
        alert("Exporting report to PDF/CSV...");
    });

    const navItems = document.querySelectorAll('#navMenu li[data-target]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            const targetView = item.getAttribute('data-target');
            switchView(targetView);
        });
    });

    document.getElementById('viewAllBtn').addEventListener('click', () => {
        document.querySelector('li[data-target="view-students"]').click();
    });

    document.getElementById('clearStudentBtn').addEventListener('click', () => {
        selectedStudentId = null;
        switchView('view-overview');
    });

    document.getElementById('reportStudentSelect').addEventListener('change', (e) => {
        renderReportCard(parseInt(e.target.value));
    });

    document.getElementById('prevStudentBtn').addEventListener('click', () => {
        const select = document.getElementById('reportStudentSelect');
        if (select.selectedIndex > 0) {
            select.selectedIndex--;
            select.dispatchEvent(new Event('change'));
        }
    });
    document.getElementById('nextStudentBtn').addEventListener('click', () => {
        const select = document.getElementById('reportStudentSelect');
        if (select.selectedIndex < select.options.length - 1) {
            select.selectedIndex++;
            select.dispatchEvent(new Event('change'));
        }
    });

    document.getElementById('printReportBtn').addEventListener('click', () => {
        window.print();
    });

    let pendingData = null;

    const fileInput = document.getElementById('jsonFileInput');
    const dropZone = document.getElementById('dropZone');
    const statusEl = document.getElementById('uploadStatus');
    const loadBtn = document.getElementById('loadDataBtn');
    const resetBtn = document.getElementById('resetDataBtn');

    function handleFile(file) {
        if (!file || !file.name.endsWith('.json')) {
            statusEl.textContent = '❌ Please select a valid .json file.';
            statusEl.className = 'upload-status error';
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Must be a non-empty array');
                const required = ['id', 'name', 'math', 'science', 'english', 'history', 'status'];
                const valid = parsed.every(s => required.every(k => k in s));
                if (!valid) throw new Error('Missing required fields');

                pendingData = parsed;
                loadBtn.disabled = false;
                statusEl.textContent = `✅ "${file.name}" loaded — ${parsed.length} students found. Click "Apply Data".`;
                statusEl.className = 'upload-status success';
            } catch (err) {
                pendingData = null;
                loadBtn.disabled = true;
                statusEl.textContent = `❌ Invalid format: ${err.message}`;
                statusEl.className = 'upload-status error';
            }
        };
        reader.readAsText(file);
    }

    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFile(e.dataTransfer.files[0]);
    });

    loadBtn.addEventListener('click', () => {
        if (!pendingData) return;
        processAndLoad(pendingData);
        statusEl.textContent = '🎉 Dashboard updated with your data!';
        loadBtn.disabled = true;
        pendingData = null;
    });

    resetBtn.addEventListener('click', () => {
        fetchData();
        statusEl.textContent = '🔄 Reset to default data.';
        statusEl.className = 'upload-status success';
        loadBtn.disabled = true;
        pendingData = null;
    });
});

async function fetchData() {
    try {
        const response = await fetch('data.json');
        const raw = await response.json();
        processAndLoad(raw);
    } catch (error) {
        console.error("Error loading data:", error);
    }
}

function processAndLoad(raw) {
    studentsData = raw.map(s => ({ ...s }));

    studentsData.forEach(student => {
        student.average = parseFloat(((student.math + student.science + student.english + student.history) / 4).toFixed(1));
        student.totalScore = student.math + student.science + student.english + student.history;
    });

    studentsData.sort((a, b) => b.average - a.average);
    studentsData.forEach((student, index) => { student.rank = index + 1; });

    selectedStudentId = null;
    switchView('view-overview');
    document.querySelector('li[data-target="view-overview"]').click();
    updateViews(studentsData);
}

function switchView(viewId) {
    currentView = viewId;

    document.querySelectorAll('.view-section').forEach(view => {
        view.style.display = 'none';
        view.classList.remove('active');
    });

    const target = document.getElementById(viewId);
    if (target) {
        target.style.display = 'block';
        setTimeout(() => target.classList.add('active'), 10);
    }

    const title = document.getElementById('pageTitle');
    const subtitle = document.getElementById('pageSubtitle');
    const clearBtn = document.getElementById('clearStudentBtn');

    if (viewId === 'view-overview') {
        if (selectedStudentId) {
            const student = studentsData.find(s => s.id === selectedStudentId);
            title.innerText = `Overview: ${student.name}`;
            subtitle.innerText = `Detailed performance breakdown for ${student.name}.`;
            clearBtn.style.display = 'block';
        } else {
            title.innerText = "Dashboard Overview";
            subtitle.innerText = "Welcome back, here is the latest student performance data.";
            clearBtn.style.display = 'none';
        }
        updateDashboard(studentsData);
    } else {
        clearBtn.style.display = 'none';
        if (viewId === 'view-students') {
            title.innerText = "All Students";
            subtitle.innerText = "Complete directory of all students, their ranks, and grades.";
        } else if (viewId === 'view-subjects') {
            title.innerText = "Subject Analytics";
            subtitle.innerText = "Top performers and overall insights for each subject.";
        } else if (viewId === 'view-reports') {
            title.innerText = "Student Reports";
            subtitle.innerText = "Individual report cards for each student.";
            const select = document.getElementById('reportStudentSelect');
            if (select.options.length > 0) {
                renderReportCard(parseInt(select.value));
            }
        }
    }
}

function selectStudent(id) {
    selectedStudentId = id;
    document.querySelector('li[data-target="view-overview"]').click();
}

function updateViews(data) {
    renderTopStudents(data);
    renderAllStudents(data);
    renderSubjectPerformers(data);
    populateReportDropdown(data);
    if (currentView === 'view-overview') {
        updateDashboard(data);
    }
}

function updateDashboard(data, themeChange = false) {
    if (!themeChange) {
        updateSummaryCards(data);
        if (!selectedStudentId) {
            document.querySelector('.table-section').style.display = 'block'; 
        } else {
            document.querySelector('.table-section').style.display = 'none'; 
        }
    }
    renderCharts(data);
}

function updateSummaryCards(data) {
    if (selectedStudentId) {
        const student = data.find(s => s.id === selectedStudentId);
        if (!student) return;

        document.querySelector('.kpi-grid').children[0].querySelector('.kpi-label').innerText = 'Class Rank';
        document.getElementById('totalStudents').innerText = '#' + student.rank;

        document.querySelector('.kpi-grid').children[1].querySelector('.kpi-label').innerText = 'Total Score';
        document.getElementById('totalPassed').innerText = student.totalScore;

        document.querySelector('.kpi-grid').children[2].querySelector('.kpi-label').innerText = 'Status';
        document.getElementById('totalFailed').innerText = student.status;

       
        const failedCard = document.querySelector('.kpi-grid').children[2].querySelector('.kpi-icon');
        if (student.status === 'Passed') {
            failedCard.className = 'kpi-icon green';
            failedCard.innerHTML = '<i class="fa-solid fa-check-circle"></i>';
        } else {
            failedCard.className = 'kpi-icon red';
            failedCard.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
        }

        document.querySelector('.kpi-grid').children[3].querySelector('.kpi-label').innerText = 'Average Marks';
        document.getElementById('avgMarks').innerText = student.average + '%';

    } else {
        
        const total = data.length;
        const passed = data.filter(s => s.status === 'Passed').length;
        const failed = data.filter(s => s.status === 'Failed').length;

        let totalMarks = 0;
        data.forEach(s => totalMarks += s.average);
        const avgMarks = total > 0 ? (totalMarks / total).toFixed(1) : 0;

        document.querySelector('.kpi-grid').children[0].querySelector('.kpi-label').innerText = 'Total Students';
        document.getElementById('totalStudents').innerText = total;

        document.querySelector('.kpi-grid').children[1].querySelector('.kpi-label').innerText = 'Passed';
        document.getElementById('totalPassed').innerText = passed;

        document.querySelector('.kpi-grid').children[2].querySelector('.kpi-label').innerText = 'Failed';
        document.getElementById('totalFailed').innerText = failed;

        const failedCard = document.querySelector('.kpi-grid').children[2].querySelector('.kpi-icon');
        failedCard.className = 'kpi-icon red';
        failedCard.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';

        document.querySelector('.kpi-grid').children[3].querySelector('.kpi-label').innerText = 'Average Marks';
        document.getElementById('avgMarks').innerText = avgMarks + '%';
    }
}

function renderCharts(data) {
    const textColor = isDarkMode ? '#ffffff' : '#2b3674';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    const primaryColor = '#4318ff';
    const successColor = '#05cd99';
    const dangerColor = '#ee5d50';

    Chart.defaults.color = textColor;
    Chart.defaults.font.family = "'Outfit', sans-serif";

    const commonOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: textColor } } } };
    const axesOptions = { scales: { y: { grid: { color: gridColor }, ticks: { color: textColor }, max: 100 }, x: { grid: { display: false }, ticks: { color: textColor } } } };

    Object.values(charts).forEach(chart => { if (chart) chart.destroy(); });

    
    const subjectAverages = { math: 0, science: 0, english: 0, history: 0 };
    if (data.length > 0) {
        data.forEach(s => { subjectAverages.math += s.math; subjectAverages.science += s.science; subjectAverages.english += s.english; subjectAverages.history += s.history; });
        Object.keys(subjectAverages).forEach(k => subjectAverages[k] /= data.length);
    }

    const ctxBar = document.getElementById('barChart');
    if (ctxBar) {
        let datasets = [];
        if (selectedStudentId) {
            const student = data.find(s => s.id === selectedStudentId);
            datasets = [
                { label: `${student.name}'s Score`, data: [student.math, student.science, student.english, student.history], backgroundColor: successColor, borderRadius: 8, barPercentage: 0.6 },
                { label: 'Class Average', data: [subjectAverages.math, subjectAverages.science, subjectAverages.english, subjectAverages.history], backgroundColor: 'rgba(163, 174, 208, 0.5)', borderRadius: 8, barPercentage: 0.6 }
            ];
            document.querySelector('#barChart').parentElement.previousElementSibling.querySelector('h2').innerText = `${student.name}'s Subject Performance`;
        } else {
            datasets = [
                { label: 'Average Score', data: [subjectAverages.math, subjectAverages.science, subjectAverages.english, subjectAverages.history], backgroundColor: primaryColor, borderRadius: 8, barPercentage: 0.6 }
            ];
            document.querySelector('#barChart').parentElement.previousElementSibling.querySelector('h2').innerText = `Class Subject Performance`;
        }

        charts.bar = new Chart(ctxBar.getContext('2d'), {
            type: 'bar',
            data: { labels: ['Math', 'Science', 'English', 'History'], datasets: datasets },
            options: { ...commonOptions, ...axesOptions }
        });
    }

    const ctxDoughnut = document.getElementById('doughnutChart');
    if (ctxDoughnut) {
        if (selectedStudentId) {
            const student = data.find(s => s.id === selectedStudentId);
            document.querySelector('#doughnutChart').parentElement.previousElementSibling.querySelector('h2').innerText = `Subject Contribution`;
            charts.doughnut = new Chart(ctxDoughnut.getContext('2d'), {
                type: 'doughnut',
                data: { labels: ['Math', 'Science', 'English', 'History'], datasets: [{ data: [student.math, student.science, student.english, student.history], backgroundColor: ['#4318ff', '#39b8ff', '#05cd99', '#ffb547'], borderWidth: 0, cutout: '75%' }] },
                options: { ...commonOptions, plugins: { legend: { position: 'bottom', labels: { color: textColor } } } }
            });
        } else {
            const passed = data.filter(s => s.status === 'Passed').length;
            const failed = data.filter(s => s.status === 'Failed').length;
            document.querySelector('#doughnutChart').parentElement.previousElementSibling.querySelector('h2').innerText = `Pass Rate`;
            charts.doughnut = new Chart(ctxDoughnut.getContext('2d'), {
                type: 'doughnut',
                data: { labels: ['Passed', 'Failed'], datasets: [{ data: [passed, failed], backgroundColor: [successColor, dangerColor], borderWidth: 0, cutout: '75%' }] },
                options: { ...commonOptions, plugins: { legend: { position: 'bottom', labels: { color: textColor } } } }
            });
        }
    }
}

function renderTopStudents(data) {
    const sortedData = [...data].sort((a, b) => b.average - a.average).slice(0, 5);
    const tbody = document.getElementById('topStudentsBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    appendRowsToTable(sortedData, tbody, false);
}

function renderAllStudents(data) {
    const sortedData = [...data].sort((a, b) => a.rank - b.rank);
    const tbody = document.getElementById('allStudentsBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    appendRowsToTable(sortedData, tbody, true);
}

function appendRowsToTable(data, tbody, showId = false) {
    data.forEach((student) => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer'; 
        tr.onclick = () => selectStudent(student.id); 

        const statusClass = student.status === 'Passed' ? 'status-passed' : 'status-failed';

        let html = '';
        if (showId) html += `<td><b>#${String(student.id).padStart(3, '0')}</b></td>`;

        html += `
            <td>#${student.rank}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random&color=fff&size=32" style="border-radius:50%">
                    ${student.name}
                </div>
            </td>
            <td>${student.math}</td>
            <td>${student.science}</td>
            <td>${student.english}</td>
            <td>${student.history}</td>
            <td style="font-weight: 700; color: var(--primary);">${student.average}%</td>
            <td><span class="status-badge ${statusClass}">${student.status}</span></td>
        `;
        tr.innerHTML = html;
        tbody.appendChild(tr);
    });
}

function renderSubjectPerformers(data) {
    const grid = document.getElementById('subjectPerformersGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const subjects = ['math', 'science', 'english', 'history'];
    const subjectNames = { math: 'Mathematics', science: 'Science', english: 'English', history: 'History' };
    const iconColorClass = { math: 'blue', science: 'green', english: 'purple', history: 'warning' };
    const icons = { math: 'fa-calculator', science: 'fa-flask', english: 'fa-book', history: 'fa-landmark' };
    const barColors = { math: '#4318ff', science: '#05cd99', english: '#39b8ff', history: '#ffb547' };

    if (data.length === 0) return;

    const textColor = isDarkMode ? '#aaaacc' : '#2b3674';
    const gridColor = isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';

   
    subjects.forEach(sub => {
        const sorted = [...data].sort((a, b) => b[sub] - a[sub]);
        const topPerformer = sorted[0];
        const avg = (data.reduce((sum, s) => sum + s[sub], 0) / data.length).toFixed(1);
        const canvasId = `subChart_${sub}`;

        const card = document.createElement('div');
        card.className = 'subject-chart-card glass-panel fade-in';

        card.innerHTML = `
            <div class="subject-chart-header">
                <div class="subject-chart-title">
                    <div class="kpi-icon ${iconColorClass[sub]}" style="width:40px;height:40px;font-size:1.1rem;">
                        <i class="fa-solid ${icons[sub]}"></i>
                    </div>
                    <span>${subjectNames[sub]}</span>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:1.3rem;font-weight:800;color:${barColors[sub]};">${avg}%</div>
                    <div class="subject-chart-meta">Class Average</div>
                </div>
            </div>
            <div class="subject-chart-canvas">
                <canvas id="${canvasId}"></canvas>
            </div>
        `;
        grid.appendChild(card);

        const ctx = document.getElementById(canvasId).getContext('2d');
        const maxScore = topPerformer[sub];

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(s => s.name.split(' ')[0]),
                datasets: [{
                    label: subjectNames[sub],
                    data: data.map(s => s[sub]),
                    borderColor: barColors[sub],
                    borderWidth: 2.5,
                    pointBackgroundColor: barColors[sub],
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.4,
                    fill: true,
                    backgroundColor: (context) => {
                        const chart = context.chart;
                        const { ctx: c, chartArea } = chart;
                        if (!chartArea) return 'transparent';
                        const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, barColors[sub] + '55');
                        gradient.addColorStop(1, barColors[sub] + '05');
                        return gradient;
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: { title: (items) => data[items[0].dataIndex].name }
                    }
                },
                scales: {
                    y: {
                        min: 0, max: 100,
                        grid: { color: gridColor },
                        ticks: { color: textColor, font: { size: 10 } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor, font: { size: 9 }, maxRotation: 35 }
                    }
                }
            }
        });
    });

    
    const donutSubjects = [
        { key: 'math', color: '#4318ff', label: 'Mathematics' },
        { key: 'science', color: '#05cd99', label: 'Science' },
        { key: 'english', color: '#39b8ff', label: 'English' },
        { key: 'history', color: '#ffb547', label: 'History' }
    ];

    donutSubjects.forEach(({ key, color, label }) => {
        const canvas = document.getElementById(`donut_${key}`);
        if (!canvas) return;

        const avg = parseFloat((data.reduce((sum, s) => sum + s[key], 0) / data.length).toFixed(1));
        const remainder = 100 - avg;

       
        const existKey = `_donut_${key}`;
        if (window[existKey]) { window[existKey].destroy(); }

      
        const centerTextPlugin = {
            id: `centerText_${key}`,
            afterDraw(chart) {
                const { ctx, chartArea: { top, bottom, left, right } } = chart;
                const cx = (left + right) / 2;
                const cy = (top + bottom) / 2;
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = "bold 22px 'Outfit', sans-serif";
                ctx.fillStyle = color;
                ctx.fillText(`${avg}%`, cx, cy - 8);
                ctx.font = "500 11px 'Outfit', sans-serif";
                ctx.fillStyle = isDarkMode ? '#aaaacc' : '#a3aed0';
                ctx.fillText('AVG', cx, cy + 14);
                ctx.restore();
            }
        };

        window[existKey] = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [avg, remainder],
                    backgroundColor: [color, isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'],
                    borderWidth: 0,
                    cutout: '78%',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                animation: { animateRotate: true, duration: 900 }
            },
            plugins: [centerTextPlugin]
        });
    });
}

function filterData(query) {
    const filtered = studentsData.filter(student =>
        student.name.toLowerCase().includes(query.toLowerCase())
    );
    updateViews(filtered);
}

function populateReportDropdown(data) {
    const select = document.getElementById('reportStudentSelect');
    if (!select) return;
    select.innerHTML = '';
    const sorted = [...data].sort((a, b) => a.rank - b.rank);
    sorted.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `#${student.rank} - ${student.name}`;
        select.appendChild(option);
    });
}

function getLetterGrade(score) {
    if (score >= 90) return { letter: 'A+', color: '#05cd99' };
    if (score >= 80) return { letter: 'A', color: '#39b8ff' };
    if (score >= 70) return { letter: 'B', color: '#4318ff' };
    if (score >= 60) return { letter: 'C', color: '#ffb547' };
    if (score >= 50) return { letter: 'D', color: '#ff9f43' };
    return { letter: 'F', color: '#ee5d50' };
}

function getBarColor(score) {
    if (score >= 80) return '#05cd99';
    if (score >= 60) return '#4318ff';
    if (score >= 50) return '#ffb547';
    return '#ee5d50';
}

function renderReportCard(studentId) {
    const student = studentsData.find(s => s.id === studentId);
    if (!student) return;

    const container = document.getElementById('reportCard');
    if (!container) return;

    const subjects = [
        { name: 'Mathematics', key: 'math', icon: 'fa-calculator' },
        { name: 'Science', key: 'science', icon: 'fa-flask' },
        { name: 'English', key: 'english', icon: 'fa-book' },
        { name: 'History', key: 'history', icon: 'fa-landmark' }
    ];

    const overallGrade = getLetterGrade(student.average);
    const totalScore = student.math + student.science + student.english + student.history;
    const maxScore = 400;

    
    let bestSubject = subjects[0], worstSubject = subjects[0];
    subjects.forEach(sub => {
        if (student[sub.key] > student[bestSubject.key]) bestSubject = sub;
        if (student[sub.key] < student[worstSubject.key]) worstSubject = sub;
    });

    let gradeRowsHTML = '';
    subjects.forEach(sub => {
        const score = student[sub.key];
        const grade = getLetterGrade(score);
        const barColor = getBarColor(score);
        gradeRowsHTML += `
            <div class="grade-row">
                <span class="grade-subject"><i class="fa-solid ${sub.icon}" style="margin-right:8px; color: ${barColor};"></i>${sub.name}</span>
                <div class="grade-bar-wrapper">
                    <div class="grade-bar" style="width: ${score}%; background: ${barColor};"></div>
                </div>
                <span class="grade-score">${score}/100</span>
                <span class="grade-letter" style="background: ${grade.color}20; color: ${grade.color};">${grade.letter}</span>
            </div>
        `;
    });

   
    let remarks = '';
    if (student.status === 'Passed') {
        if (student.average >= 90) {
            remarks = `Outstanding performance! ${student.name} is an exceptional student with consistently high marks across all subjects. Keep up the excellent work!`;
        } else if (student.average >= 75) {
            remarks = `Very good performance by ${student.name}. Shows strong understanding of the curriculum. Best performance in ${bestSubject.name}. Could improve further in ${worstSubject.name}.`;
        } else {
            remarks = `${student.name} has passed with a satisfactory performance. Strongest in ${bestSubject.name}, but should focus on improving ${worstSubject.name} to achieve better overall results.`;
        }
    } else {
        remarks = `${student.name} needs significant improvement to meet the passing criteria. ${worstSubject.name} requires immediate attention with a score of ${student[worstSubject.key]}/100. Extra tutoring and practice sessions are recommended.`;
    }

    container.innerHTML = `
        <!-- Report Header -->
        <div class="report-header">
            <div class="report-header-left">
                <img class="report-avatar" src="https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random&color=fff&size=80" alt="${student.name}">
                <div>
                    <h2 class="report-student-name">${student.name}</h2>
                    <p class="report-student-meta">Student ID: #${String(student.id).padStart(3, '0')} &nbsp;|&nbsp; Class Rank: #${student.rank} of ${studentsData.length}</p>
                </div>
            </div>
            <div class="report-header-right">
                <p class="report-overall-grade" style="color: ${overallGrade.color};">${overallGrade.letter}</p>
                <p class="report-overall-label">Overall Grade</p>
            </div>
        </div>

        <!-- Quick Stats -->
        <div class="report-stats-row">
            <div class="report-stat-item">
                <p class="report-stat-value" style="color: var(--primary);">${student.average}%</p>
                <p class="report-stat-label">Average Score</p>
            </div>
            <div class="report-stat-item">
                <p class="report-stat-value">${totalScore}/${maxScore}</p>
                <p class="report-stat-label">Total Marks</p>
            </div>
            <div class="report-stat-item">
                <p class="report-stat-value" style="color: ${student.status === 'Passed' ? 'var(--success)' : 'var(--danger)'};">${student.status}</p>
                <p class="report-stat-label">Result</p>
            </div>
            <div class="report-stat-item">
                <p class="report-stat-value" style="color: ${getBarColor(student[bestSubject.key])};">${bestSubject.name}</p>
                <p class="report-stat-label">Best Subject (${student[bestSubject.key]})</p>
            </div>
        </div>

        <!-- Grades Breakdown -->
        <div class="report-grades-section">
            <h3><i class="fa-solid fa-chart-bar" style="margin-right:8px; color: var(--primary);"></i>Subject-wise Grades</h3>
            ${gradeRowsHTML}
        </div>

        <!-- Remarks -->
        <div class="report-remarks">
            <h3><i class="fa-solid fa-comment-dots" style="margin-right: 8px; color: var(--primary);"></i>Teacher's Remarks</h3>
            <p>${remarks}</p>
        </div>
    `;
}

