const socket = io()

const app = document.getElementById('app')
let timerInterval = null
let playerName = ''

function renderStage({ title, input = false, answers = null, loader = false, timer = null, onSubmit = null }) {
    app.innerHTML = ''
    const titleEl = document.createElement('h2')
    titleEl.className = 'title'
    titleEl.innerText = title
    app.appendChild(titleEl)
    if (loader) {
        const loaderDiv = document.createElement('div')
        loaderDiv.className = 'loader'
        app.appendChild(loaderDiv)
    }
    let timerEl = null
    if (timer !== null) {
        timerEl = document.createElement('div')
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
    if (input) {
        const inputEl = document.createElement('input')
        inputEl.type = 'text'
        inputEl.className = 'input'
        inputEl.placeholder = 'Введите ответ...'
        inputEl.style.margin = '1rem 0'
        inputEl.style.fontSize = '1.1rem'
        inputEl.style.padding = '0.5rem 1rem'
        inputEl.style.borderRadius = '0.5rem'
        inputEl.style.border = '1px solid #e5e7eb'
        app.appendChild(inputEl)
        const btn = document.createElement('button')
        btn.className = 'btn'
        btn.innerText = 'Ответить'
        btn.onclick = () => {
            if (onSubmit) onSubmit(inputEl.value)
        }
        app.appendChild(btn)
        inputEl.addEventListener('keydown', e => {
            if (e.key === 'Enter') btn.click()
        })
        inputEl.focus()
    }
    if (answers) {
        const kahootColors = ['red', 'blue', 'yellow', 'green', 'gray', 'gray'];
        const kahootIcons = ['▲', '◆', '◯', '■', '', ''];
        answers.forEach((ans, i) => {
            const btn = document.createElement('button')
            btn.className = 'answer-btn ' + (kahootColors[i] || 'gray')
            btn.innerHTML = `<span class="icon">${kahootIcons[i] || ''}</span> ${ans}`
            btn.onclick = () => {
                if (onSubmit) onSubmit(ans)
            }
            app.appendChild(btn)
        })
    }
}

function renderLoader(title = 'Ждем ответа остальных...') {
    renderStage({ title, loader: true })
}

function renderResult({ correct, noAnswer }) {
    app.innerHTML = ''
    const icon = document.createElement('div')
    icon.style.fontSize = '4rem'
    icon.style.marginBottom = '1rem'
    icon.innerText = noAnswer ? '⏰' : (correct ? '✅' : '❌')
    app.appendChild(icon)
    const titleEl = document.createElement('h2')
    titleEl.className = 'title'
    if (noAnswer) {
        titleEl.innerText = 'Время вышло!'
    } else if (correct) {
        titleEl.innerText = 'Правильно!'
    } else {
        titleEl.innerText = 'Неправильно!'
    }
    app.appendChild(titleEl)
    const msg = document.createElement('div')
    msg.style.textAlign = 'center'
    msg.style.fontSize = '1.1rem'
    msg.style.marginTop = '0.5rem'
    if (noAnswer) {
        msg.innerText = 'В следующий раз отвечай чуть-чуть быстрей'
    } else if (correct) {
        msg.innerText = 'Продолжай в том же духе :)'
    } else {
        msg.innerText = 'Ничего страшного, ответишь правильно в следующий раз :('
    }
    app.appendChild(msg)
}

function renderLeaderboard(leaderboard) {
    app.innerHTML = ''
    const titleEl = document.createElement('h2')
    titleEl.className = 'title'
    titleEl.innerText = 'Таблица лидеров:'
    app.appendChild(titleEl)
    const ul = document.createElement('ul')
    ul.className = 'score-list'
    for (const player of leaderboard) {
        const li = document.createElement('li')
        if (player.length > 2 && player[2]) {
            li.innerText = `${player[2]} ${player[0]}: ${player[1]}`
        } else {
            li.innerText = `${player[0]}: ${player[1]}`
        }
        ul.appendChild(li)
    }
    app.appendChild(ul)
    const btn = document.createElement('button')
    btn.className = 'btn'
    btn.innerText = 'Дальше'
    btn.onclick = () => socket.emit('next')
    app.appendChild(btn)
}

function renderGameOver(leaderboard) {
    app.innerHTML = ''
    const titleEl = document.createElement('h2')
    titleEl.className = 'title'
    titleEl.innerText = 'Игра окончена!'
    app.appendChild(titleEl)
    const ul = document.createElement('ul')
    ul.className = 'score-list'
    for (const player of leaderboard) {
        const li = document.createElement('li')
        if (player.length > 2 && player[2]) {
            li.innerText = `${player[2]} ${player[0]}: ${player[1]}`
        } else {
            li.innerText = `${player[0]}: ${player[1]}`
        }
        ul.appendChild(li)
    }
    app.appendChild(ul)
    const finalMsg = document.createElement('div')
    finalMsg.style.marginTop = '2rem'
    finalMsg.style.fontSize = '1.2rem'
    finalMsg.style.textAlign = 'center'
    finalMsg.innerText = 'Спасибо за игру!'
    app.appendChild(finalMsg)
}

// --- Логика ---

socket.on('connected', async _ => {
    app.innerHTML = ''
    const titleEl = document.createElement('h2')
    titleEl.className = 'title'
    titleEl.innerText = 'Введите свое имя:'
    app.appendChild(titleEl)
    const inputEl = document.createElement('input')
    inputEl.type = 'text'
    inputEl.className = 'input'
    inputEl.placeholder = 'Ваше имя'
    inputEl.style.margin = '1rem 0'
    inputEl.style.fontSize = '1.1rem'
    inputEl.style.padding = '0.5rem 1rem'
    inputEl.style.borderRadius = '0.5rem'
    inputEl.style.border = '1px solid #e5e7eb'
    app.appendChild(inputEl)
    // --- Эмодзи ---
    const emojiList = ['😀', '🦄', '🤖', '🐱']
    let selectedEmoji = emojiList[0]
    const emojiWrap = document.createElement('div')
    emojiWrap.style.display = 'flex'
    emojiWrap.style.gap = '1rem'
    emojiWrap.style.margin = '0.5rem 0 1rem 0'
    emojiWrap.style.justifyContent = 'center'
    emojiWrap.style.fontSize = '2rem'
    emojiList.forEach(emoji => {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'emoji-btn'
        btn.innerText = emoji
        btn.style.background = 'none'
        btn.style.border = '2px solid #e5e7eb'
        btn.style.borderRadius = '0.5rem'
        btn.style.cursor = 'pointer'
        btn.style.transition = 'border 0.2s'
        btn.onclick = () => {
            selectedEmoji = emoji
            Array.from(emojiWrap.children).forEach(b => b.style.border = '2px solid #e5e7eb')
            btn.style.border = '2px solid #4F8EF7'
        }
        if (emoji === selectedEmoji) btn.style.border = '2px solid #4F8EF7'
        emojiWrap.appendChild(btn)
    })
    app.appendChild(emojiWrap)
    // --- Кнопка ---
    const btn = document.createElement('button')
    btn.className = 'btn'
    btn.innerText = 'Присоединиться'
    btn.onclick = () => {
        playerName = inputEl.value.trim()
        if (playerName) {
            socket.emit('name', { name: playerName, emoji: selectedEmoji })
            renderLoader('Ожидаем начала игры')
        }
    }
    app.appendChild(btn)
    inputEl.addEventListener('keydown', e => {
        if (e.key === 'Enter') btn.click()
    })
    inputEl.focus()
})

socket.on('stage', (stage) => {
    if (stage.type === 'open') {
        renderStage({
            title: stage.text,
            input: true,
            timer: stage.time,
            onSubmit: (answer) => {
                socket.emit('answer', answer)
                renderLoader()
            }
        })
    } else if (stage.type === 'choice') {
        renderStage({
            title: stage.text,
            answers: stage.answers,
            timer: stage.time,
            onSubmit: (answer) => {
                socket.emit('answer', answer)
                renderLoader()
            }
        })
    } else if (stage.type === 'image') {
        app.innerHTML = ''
        const titleEl = document.createElement('h2')
        titleEl.className = 'title'
        titleEl.innerText = 'Посмотрите на изображение'
        app.appendChild(titleEl)
        const img = document.createElement('img')
        img.src = stage.playerImg
        img.className = 'img'
        app.appendChild(img)
    } else if (stage.type === 'tags') {
        app.innerHTML = ''
        const titleEl = document.createElement('h2')
        titleEl.className = 'title'
        titleEl.innerText = stage.text
        app.appendChild(titleEl)
        const inputEl = document.createElement('input')
        inputEl.type = 'text'
        inputEl.className = 'input'
        inputEl.placeholder = 'Введите слово...'
        inputEl.style.marginRight = '10px'
        inputEl.style.fontSize = '1.1rem'
        inputEl.style.padding = '0.5rem 1rem'
        inputEl.style.borderRadius = '0.5rem'
        inputEl.style.border = '1px solid #e5e7eb'
        app.appendChild(inputEl)
        const btn = document.createElement('button')
        btn.className = 'btn'
        btn.innerText = 'Отправить'
        btn.onclick = () => {
            const tag = inputEl.value.trim()
            if (tag) {
                console.log('[PLAYER] Отправляю тег:', tag)
                socket.emit('tag', tag)
                inputEl.value = ''
            }
        }
        app.appendChild(btn)
    } else if (stage.type === 'chart') {
        app.innerHTML = '';
        const titleEl = document.createElement('h2');
        titleEl.className = 'title';
        titleEl.innerText = stage.chartTitle;
        app.appendChild(titleEl);
        const chartDiv = document.createElement('div');
        chartDiv.style.width = '100%';
        chartDiv.style.maxWidth = '400px';
        chartDiv.style.margin = '2rem auto';
        const canvas = document.createElement('canvas');
        canvas.id = 'chartjs-canvas';
        chartDiv.appendChild(canvas);
        app.appendChild(chartDiv);
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
        app.innerHTML = ''
        const titleEl = document.createElement('h2')
        titleEl.className = 'title'
        titleEl.innerText = stage.playerText
        app.appendChild(titleEl)
    } else if (stage.type === 'feedback') {
        app.innerHTML = '';
        const titleEl = document.createElement('h2');
        titleEl.className = 'title';
        titleEl.innerText = stage.playerText;
        app.appendChild(titleEl);
        const textarea = document.createElement('textarea');
        textarea.className = 'input';
        textarea.style.width = '100%';
        textarea.style.minHeight = '80px';
        textarea.style.marginBottom = '1rem';
        textarea.placeholder = 'Ваш отзыв...';
        app.appendChild(textarea);
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.innerText = 'Отправить';
        btn.onclick = () => {
            const text = textarea.value.trim();
            if (text) {
                socket.emit('feedback', { id: socket.id, text });
                app.innerHTML = '';
                const thanks = document.createElement('div');
                thanks.style.fontSize = '1.3rem';
                thanks.style.textAlign = 'center';
                thanks.style.marginTop = '2rem';
                thanks.innerText = 'Спасибо за обратную связь!';
                app.appendChild(thanks);
            }
        };
        app.appendChild(btn);
    }
})

socket.on('updateTags', (tags) => {
    // Можно добавить визуализацию облака тегов, если нужно
})

socket.on('correct', () => {
    renderResult({ correct: true })
})
socket.on('incorrect', () => {
    renderResult({ correct: false })
})
socket.on('noAnswer', () => {
    renderResult({ noAnswer: true })
})
socket.on('timeUp', (leaderboard) => {
    renderLeaderboard(leaderboard)
})
socket.on('gameover', (leaderboard) => {
    renderGameOver(leaderboard)
})
socket.on('banned', () => {
    app.innerHTML = '';
    const titleEl = document.createElement('h2');
    titleEl.className = 'title';
    titleEl.innerText = 'К сожалению, вы были исключены из сессии за нарушение правил';
    app.appendChild(titleEl);
});



