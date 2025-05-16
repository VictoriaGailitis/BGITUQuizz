const socket = io()
socket.emit('host')

const app = document.getElementById('app')
let timerInterval = null
let players = []
let gameStarted = false

// Глобальная ссылка на экземпляр TagCloud
window.tagCloudInstance = null;

function renderPlayersList() {
    const ul = document.createElement('ul')
    ul.className = 'score-list'
    for (const player of players) {
        const li = document.createElement('li')
        if (typeof player === 'object' && player.emoji) {
            li.innerText = `${player.emoji} ${player.name}`
        } else if (typeof player === 'object' && player.name) {
            li.innerText = player.name
        } else {
            li.innerText = player
        }
        ul.appendChild(li)
    }
    return ul
}

function renderStage({ title, loader = true, timer = null, showNext = false, showStart = false, showPlayersList = false }) {
    app.innerHTML = ''
    // Список игроков только если showPlayersList === true
    if (showPlayersList && players.length > 0) {
        const playersTitle = document.createElement('div')
        playersTitle.className = 'timer'
        playersTitle.style.fontSize = '1.1rem'
        playersTitle.style.color = '#6b7280'
        playersTitle.innerText = 'Игроки:'
        app.appendChild(playersTitle)
        app.appendChild(renderPlayersList())
    }
    const titleEl = document.createElement('h2')
    titleEl.className = 'title'
    titleEl.innerText = title
    app.appendChild(titleEl)
    if (loader) {
        const loaderDiv = document.createElement('div')
        loaderDiv.className = 'loader'
        app.appendChild(loaderDiv)
    }
    if (timer !== null) {
        const timerEl = document.createElement('div')
        timerEl.className = 'timer'
        timerEl.id = 'timerEl'
        timerEl.innerText = `Осталось секунд: ${timer}`
        app.appendChild(timerEl)
        if (timerInterval) clearInterval(timerInterval)
        let timeLeft = timer
        timerInterval = setInterval(() => {
            timeLeft--
            timerEl.innerText = `Осталось секунд: ${timeLeft}`
            if (timeLeft <= 0) {
                clearInterval(timerInterval)
            }
        }, 1000)
    } else {
        if (timerInterval) clearInterval(timerInterval)
    }
    if (showStart && !gameStarted) {
        const btn = document.createElement('button')
        btn.className = 'btn'
        btn.innerText = 'Начать игру'
        btn.onclick = () => {
            socket.emit('start')
            gameStarted = true
            renderStage({ title: 'Ждем ответа игроков...', loader: true })
        }
        app.appendChild(btn)
    }
    if (showNext) {
        const btn = document.createElement('button')
        btn.className = 'btn'
        btn.innerText = 'Дальше'
        btn.onclick = () => socket.emit('next')
        app.appendChild(btn)
    }
}

function renderLeaderboard(scores) {
    app.innerHTML = '';
    const titleEl = document.createElement('h2');
    titleEl.className = 'title';
    titleEl.innerText = 'Таблица лидеров:';
    app.appendChild(titleEl);
    const ul = document.createElement('ul');
    ul.className = 'score-list';
    for (const player of scores) {
        const li = document.createElement('li');
        if (player.length > 2 && player[2]) {
            li.innerText = `${player[2]} ${player[0]}: ${player[1]}`
        } else {
            li.innerText = `${player[0]}: ${player[1]}`
        }
        ul.appendChild(li);
    }
    app.appendChild(ul);
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.innerText = 'Следующий вопрос';
    btn.onclick = () => {
        socket.emit('next');
        renderStage({ title: 'Ждем ответа игроков...', loader: true });
    };
    app.appendChild(btn);
}

function renderGameOver(leaderboard) {
    app.innerHTML = '';
    const titleEl = document.createElement('h2');
    titleEl.className = 'title';
    titleEl.innerText = 'Игра окончена!';
    app.appendChild(titleEl);
    const ul = document.createElement('ul');
    ul.className = 'score-list';
    for (const player of leaderboard) {
        const li = document.createElement('li');
        if (player.length > 2 && player[2]) {
            li.innerText = `${player[2]} ${player[0]}: ${player[1]}`
        } else {
            li.innerText = `${player[0]}: ${player[1]}`
        }
        ul.appendChild(li);
    }
    app.appendChild(ul);
    const finalMsg = document.createElement('div');
    finalMsg.style.marginTop = '2rem';
    finalMsg.style.fontSize = '1.2rem';
    finalMsg.style.textAlign = 'center';
    finalMsg.innerText = 'Спасибо за игру!';
    app.appendChild(finalMsg);
}

function renderTagCloud(tags) {
    let tagDiv = document.getElementById('tagcloud');
    if (tagDiv) {
        const wrapper = tagDiv.parentElement;
        wrapper && wrapper.remove();
    }
    // Создаём flex-обертку
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'center';
    wrapper.style.alignItems = 'center';
    wrapper.style.width = '100%';
    wrapper.style.height = '350px';

    tagDiv = document.createElement('div');
    tagDiv.id = 'tagcloud';
    tagDiv.style.width = '320px';
    tagDiv.style.height = '320px';

    wrapper.appendChild(tagDiv);

    const titleEl = app.querySelector('.title');
    if (titleEl && titleEl.nextSibling) {
        app.insertBefore(wrapper, titleEl.nextSibling);
    } else {
        app.appendChild(wrapper);
    }
    if (window.TagCloud && Array.isArray(tags) && tags.length > 0) {
        if (window.tagCloudInstance && typeof window.tagCloudInstance.destroy === 'function') {
            window.tagCloudInstance.destroy();
        }
        window.tagCloudInstance = TagCloud('#tagcloud', tags, {
            radius: 120,
            maxSpeed: 'normal',
            initSpeed: 'normal',
            direction: 135,
            keep: true,
        });
    }
}

socket.on('connected', () => {
    gameStarted = false
    renderStage({ title: 'Ожидание игроков...', loader: true, showStart: true, showPlayersList: true })
})

socket.on('name', (data) => {
    // data: { name, emoji }
    if (!players.some(p => (typeof p === 'object' ? p.name : p) === data.name)) {
        players.push(data)
        if (!gameStarted) {
            renderStage({ title: 'Ожидание игроков...', loader: true, showStart: true, showPlayersList: true })
        }
    }
})

socket.on('stage', (stage) => {
    console.log('СТАРТ ЭТАПА:', stage.type, stage.text || stage.hostText || '')
    if (stage.type === 'open' || stage.type === 'choice') {
        renderStage({ title: stage.text, loader: true, timer: stage.time })
    } else if (stage.type === 'image') {
        renderStage({ title: 'Посмотрите на изображение', loader: false, showNext: true })
        const img = document.createElement('img')
        img.src = stage.hostImg
        img.className = 'img'
        app.appendChild(img)
    } else if (stage.type === 'tags') {
        renderStage({ title: 'Облако тегов', loader: false, showNext: true })
        renderTagCloud(stage.tags || []);
    } else if (stage.type === 'chart') {
        renderStage({ title: stage.chartTitle, loader: false, showNext: true })
        // Диаграмма
        const chartDiv = document.createElement('div');
        chartDiv.style.width = '100%';
        chartDiv.style.maxWidth = '400px';
        chartDiv.style.margin = '2rem auto';
        const canvas = document.createElement('canvas');
        canvas.id = 'chartjs-canvas';
        chartDiv.appendChild(canvas);
        app.appendChild(chartDiv);
        // Chart.js
        if (window.chartInstance) window.chartInstance.destroy();
        window.chartInstance = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: stage.labels,
                datasets: [{
                    label: '',
                    data: stage.data,
                    backgroundColor: [
                        '#4F8EF7', '#F7B32B', '#E4572E', '#76B041', '#A259F7'
                    ],
                    borderRadius: 8,
                }]
            },
            options: {
                plugins: {
                    legend: { display: false },
                    title: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                },
                responsive: true,
                maintainAspectRatio: false,
            }
        });
    } else if (stage.type === 'info') {
        renderStage({ title: stage.hostText, loader: false, showNext: true })
    } else if (stage.type === 'feedback') {
        renderStage({ title: stage.hostText, loader: false, showNext: true })
    }
})

socket.on('updateTags', (tags) => {
    console.log('[HOST] Получен updateTags:', tags)
    renderTagCloud(tags);
})

socket.on('timeUp', async (scores) => {
    console.log('Получено событие timeUp у хоста, scores:', scores)
    if (timerInterval) clearInterval(timerInterval);
    renderLeaderboard(scores);
})

socket.on('gameover', async (leaderboard) => {
    renderGameOver(leaderboard);
})

socket.on('showChart', (chart) => {
    app.innerHTML = '';
    const titleEl = document.createElement('h2');
    titleEl.className = 'title';
    titleEl.innerText = 'Таблица результатов';
    app.appendChild(titleEl);
    // Палитра цветов для игроков
    const palette = ['#4F8EF7', '#F7B32B', '#E4572E', '#76B041', '#A259F7', '#FF6F61', '#2EC4B6', '#FFB400', '#B388FF', '#FF8C42'];
    // --- Новый labels с эмодзи ---
    let labelsWithEmoji = chart.labels.map((label, i) => {
        // chart.rawPlayers: массив [{name, emoji}] или [[name, score, emoji]]
        if (chart.rawPlayers && chart.rawPlayers[i] && chart.rawPlayers[i][2]) {
            return `${chart.rawPlayers[i][2]} ${label.replace(/^👑 /, '')}`;
        }
        return label.replace(/^👑 /, '');
    });
    // Для pie — легенда с цветами и именами
    if (chart.chartType === 'pie') {
        const legendDiv = document.createElement('div');
        legendDiv.style.display = 'flex';
        legendDiv.style.justifyContent = 'center';
        legendDiv.style.gap = '1.5rem';
        legendDiv.style.marginBottom = '1.2rem';
        labelsWithEmoji.forEach((label, i) => {
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            const colorBox = document.createElement('span');
            colorBox.style.display = 'inline-block';
            colorBox.style.width = '18px';
            colorBox.style.height = '18px';
            colorBox.style.background = palette[i % palette.length];
            colorBox.style.borderRadius = '4px';
            colorBox.style.marginRight = '0.5rem';
            item.appendChild(colorBox);
            const name = document.createElement('span');
            name.innerText = label;
            item.appendChild(name);
            legendDiv.appendChild(item);
        });
        app.appendChild(legendDiv);
    }
    const chartDiv = document.createElement('div');
    chartDiv.style.width = '100%';
    chartDiv.style.maxWidth = '400px';
    chartDiv.style.margin = '2rem auto';
    chartDiv.style.height = '340px';
    const canvas = document.createElement('canvas');
    canvas.id = 'chartjs-leaderboard';
    chartDiv.appendChild(canvas);
    app.appendChild(chartDiv);
    if (window.chartInstance) window.chartInstance.destroy();
    // Chart.js plugin для короны
    const crownPlugin = {
        id: 'crownPlugin',
        afterDraw: (chartInstance) => {
            const ctx = chartInstance.ctx;
            const type = chart.chartType;
            const leaderIdx = 0;
            if (type === 'bar' && !chart.horizontal) {
                // Вертикальная: рисуем корону над первым столбцом
                const meta = chartInstance.getDatasetMeta(0);
                const bar = meta.data[leaderIdx];
                if (bar) {
                    const x = bar.x;
                    const y = bar.y - 24;
                    ctx.save();
                    ctx.font = '24px serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('👑', x, y);
                    ctx.restore();
                }
            } else if (type === 'bar' && chart.horizontal) {
                // Горизонтальная: рисуем корону слева от первого бара
                const meta = chartInstance.getDatasetMeta(0);
                const bar = meta.data[leaderIdx];
                if (bar) {
                    const x = bar.x - 24;
                    const y = bar.y + bar.height / 2;
                    ctx.save();
                    ctx.font = '24px serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('👑', x, y);
                    ctx.restore();
                }
            } else if (type === 'pie') {
                // Pie: рисуем корону на секторе лидера
                const meta = chartInstance.getDatasetMeta(0);
                const arc = meta.data[leaderIdx];
                if (arc) {
                    const model = arc.getProps(['x', 'y', 'startAngle', 'endAngle', 'outerRadius'], true);
                    const angle = (model.startAngle + model.endAngle) / 2;
                    const crownX = model.x + Math.cos(angle) * (model.outerRadius * 0.7);
                    const crownY = model.y + Math.sin(angle) * (model.outerRadius * 0.7);
                    ctx.save();
                    ctx.font = '24px serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('👑', crownX, crownY);
                    ctx.restore();
                }
            }
        }
    };
    window.chartInstance = new Chart(canvas.getContext('2d'), {
        type: chart.chartType,
        data: {
            labels: labelsWithEmoji,
            datasets: [{
                label: '',
                data: chart.data,
                backgroundColor: chart.labels.map((_, i) => palette[i % palette.length]),
                borderRadius: 8,
            }]
        },
        options: {
            indexAxis: chart.horizontal ? 'y' : 'x',
            plugins: {
                legend: { display: false },
                title: { display: false },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            // context[0].dataIndex
                            if (chart.rawPlayers && chart.rawPlayers[context[0].dataIndex] && chart.rawPlayers[context[0].dataIndex][2]) {
                                return `${chart.rawPlayers[context[0].dataIndex][2]} ${chart.labels[context[0].dataIndex].replace(/^👑 /, '')}`;
                            }
                            return chart.labels[context[0].dataIndex].replace(/^👑 /, '');
                        }
                    }
                }
            },
            scales: {
                y: { beginAtZero: true }
            },
            responsive: true,
            maintainAspectRatio: false,
        },
        plugins: [crownPlugin]
    });
    // Кнопка 'Дальше' только если это не финальная горизонтальная диаграмма
    if (!chart.horizontal) {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.innerText = 'Дальше';
        btn.onclick = () => socket.emit('next');
        app.appendChild(btn);
    }
});
