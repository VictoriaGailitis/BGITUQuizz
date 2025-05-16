const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const events = require('events')
const eventEmitter = new events.EventEmitter()
const axios = require('axios')
require('dotenv').config()

// --- Redis adapter ---
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('ioredis');

const redisHost = process.env.REDIS_HOST || 'redis';
const redisPort = process.env.REDIS_PORT || 6379;

const pubClient = new createClient({ host: redisHost, port: redisPort });
const subClient = pubClient.duplicate();

(async () => {
    await pubClient.connect();
    await subClient.connect();
    io.adapter(createAdapter(pubClient, subClient));
})();
// --- END Redis adapter ---

const ADMIN_API_URL = process.env.ADMIN_API_URL || 'http://localhost:8000/api/active_game/'
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8001'

let stages = []
let userPointsMap = {}
let tagsCloud = []
let attempts = {}
let stageActive = false
let finishStage = null
let stageTimer = null
let currentStageObj = null
let hostSocketId = null
let feedbacks = {}

async function fetchGameStages() {
    const res = await axios.get(ADMIN_API_URL)
    if (!res.data || !res.data.steps) throw new Error('Нет шагов игры')
    stages = res.data.steps
}

async function isSwear(text) {
    if (!text) return false
    try {
        const res = await axios.post(`${ML_API_URL}/analyze_swear`, { text })
        return res.data.swear
    } catch (e) {
        return false
    }
}

async function isCorrectAnswer(answer, reference) {
    try {
        const res = await axios.post(`${ML_API_URL}/check_open_answer`, { answer, reference })
        // Порог близости можно вынести в env
        return res.data.similarity > (process.env.OPEN_ANSWER_THRESHOLD || 0.7)
    } catch (e) {
        return false
    }
}

io.on('connection', (socket) => {
    let questionStart
    let totalTime
    let currentStage = 0

    console.log('user connected')
    socket.emit('connected')
    socket.once("name", async (data) => {
        const name = typeof data === 'object' ? data.name : data;
        const emoji = typeof data === 'object' ? data.emoji : '';
        if (await isSwear(name)) {
            socket.emit('banned');
            socket.disconnect();
            return;
        }
        userPointsMap[socket.id] = [name, 0, emoji]
        io.emit("name", { name, emoji })
    })

    socket.on('host', () => {
        hostSocketId = socket.id;
        console.log('Host registered:', hostSocketId);
    })

    socket.on('answer', async (answer) => {
        if (await isSwear(answer)) {
            socket.emit('banned');
            socket.disconnect();
            delete userPointsMap[socket.id];
            return;
        }
        if (!stageActive || !currentStageObj) return
        if (!attempts[socket.id]) {
            attempts[socket.id] = [answer, Math.floor(getTimeLeft() / 10)]
        }
        if (Object.keys(attempts).length === Object.keys(userPointsMap).length) {
            clearTimeout(stageTimer)
            finishStage()
        }
    })

    socket.on('tag', async (tag) => {
        if (await isSwear(tag)) {
            socket.emit('banned');
            socket.disconnect();
            delete userPointsMap[socket.id];
            return;
        }
        tagsCloud.push(tag)
        io.emit('updateTags', tagsCloud)
    })

    socket.on('feedback', async (data) => {
        if (await isSwear(data.text)) {
            socket.emit('banned');
            socket.disconnect();
            delete userPointsMap[socket.id];
            return;
        }
        feedbacks[socket.id] = data.text;
        if (typeof finishStage === 'function' && Object.keys(feedbacks).length === Object.keys(userPointsMap).length) {
            finishStage();
        }
    });

    socket.once("start", async () => {
        await fetchGameStages()
        for (let i = 0; i < stages.length; i++) {
            const stage = stages[i]
            currentStage = i
            currentStageObj = stage
            if (stage.type === 'open') {
                await new Promise((resolve) => {
                    eventEmitter.emit("start", [new Date(), stage.time_limit * 1000])
                    attempts = {}
                    stageActive = true
                    io.emit('stage', { type: 'open', text: stage.options.text, time: stage.time_limit })
                    finishStage = async () => {
                        stageActive = false
                        for (const id in userPointsMap) {
                            const socketClient = io.sockets.sockets.get(id)
                            if (!attempts[id] || attempts[id][0] == null) {
                                socketClient.emit('noAnswer')
                            } else {
                                const answer = attempts[id][0]
                                const points = attempts[id][1]
                                let isCorrect = false
                                if (typeof answer === 'string' && stage.options.open_answer) {
                                    isCorrect = await isCorrectAnswer(answer, stage.options.open_answer)
                                }
                                if (isCorrect) {
                                    userPointsMap[id][1] += points
                                    socketClient.emit('correct')
                                } else {
                                    socketClient.emit('incorrect')
                                }
                            }
                        }
                        const leaderboard = getLeaderboard();
                        const chart = getChartData('bar', leaderboard);
                        const hostSocket = io.sockets.sockets.get(hostSocketId)
                        if (hostSocket) hostSocket.emit('showChart', chart)
                        io.emit('showChart', chart)
                        socket.once('next', resolve)
                    }
                    stageTimer = setTimeout(() => {
                        finishStage()
                    }, stage.time_limit * 1000)
                })
            } else if (stage.type === 'choice') {
                await new Promise((resolve) => {
                    eventEmitter.emit("start", [new Date(), stage.time_limit * 1000])
                    attempts = {}
                    stageActive = true
                    io.emit('stage', { type: 'choice', text: stage.options.text, answers: stage.options.options, time: stage.time_limit })
                    finishStage = () => {
                        stageActive = false
                        for (const id in userPointsMap) {
                            const socketClient = io.sockets.sockets.get(id)
                            if (!attempts[id] || attempts[id][0] == null) {
                                socketClient.emit('noAnswer')
                            } else {
                                const answer = attempts[id][0]
                                const points = attempts[id][1]
                                const isCorrect = answer === stage.options.correct_answer
                                if (isCorrect) {
                                    userPointsMap[id][1] += points
                                    socketClient.emit('correct')
                                } else {
                                    socketClient.emit('incorrect')
                                }
                            }
                        }
                        const leaderboard = getLeaderboard();
                        const chart = getChartData('pie', leaderboard);
                        const hostSocket = io.sockets.sockets.get(hostSocketId)
                        if (hostSocket) hostSocket.emit('showChart', chart)
                        io.emit('showChart', chart)
                        socket.once('next', resolve)
                    }
                    stageTimer = setTimeout(() => {
                        finishStage()
                    }, stage.time_limit * 1000)
                })
            } else if (stage.type === 'image') {
                await new Promise((resolve) => {
                    io.emit('stage', { type: 'image', hostImg: stage.options.hostImg, playerImg: stage.options.playerImg })
                    socket.once('next', resolve)
                })
            } else if (stage.type === 'tags') {
                tagsCloud = []
                await new Promise((resolve) => {
                    io.emit('stage', { type: 'tags', text: stage.options.text, tags: tagsCloud })
                    socket.once('next', () => {
                        resolve()
                    })
                })
            } else if (stage.type === 'chart') {
                await new Promise((resolve) => {
                    io.emit('stage', { type: 'chart', chartTitle: stage.options.chartTitle, labels: stage.options.labels, data: stage.options.data })
                    socket.once('next', () => {
                        resolve()
                    })
                })
            } else if (stage.type === 'info') {
                await new Promise((resolve) => {
                    io.emit('stage', { type: 'info', hostText: stage.options.hostText, playerText: stage.options.playerText })
                    socket.once('next', resolve)
                })
            } else if (stage.type === 'feedback') {
                feedbacks = {};
                stageActive = true;
                io.emit('stage', { type: 'feedback', hostText: stage.options.hostText, playerText: stage.options.playerText });
                await new Promise((resolve) => {
                    finishStage = () => {
                        stageActive = false;
                        io.emit('feedbackEnd');
                        const hostSocket = io.sockets.sockets.get(hostSocketId);
                        if (hostSocket) hostSocket.emit('feedbackEnd');
                        resolve();
                    };
                    socket.once('next', finishStage);
                });
                io.emit('showChart', getChartData('horizontalBar', getLeaderboard()));
                io.emit('gameover', getLeaderboard());
                process.exit(0);
            }
        }
        io.emit('showChart', getChartData('horizontalBar', getLeaderboard()));
        io.emit("gameover", getLeaderboard())
        process.exit(0)
    })

    function getLeaderboard() {
        return Object.values(userPointsMap).sort((a, b) => b[1] - a[1])
    }

    function getTimeLeft() {
        const now = new Date()
        const timeTaken = now.getMilliseconds() - questionStart.getMilliseconds()
        const timeRemaining = totalTime - timeTaken
        return timeRemaining
    }

    eventEmitter.on("start", ([timeNow, timeForQuestion]) => {
        questionStart = timeNow
        totalTime = timeForQuestion
    })
})

app.use(express.static('public'))
http.listen(3000, () => {
    console.log('listening on *:3000')
})

function getChartData(type, leaderboard) {
    const labels = leaderboard.map(([name], i) => i === 0 ? `👑 ${name}` : name);
    const data = leaderboard.map(([, score]) => score);
    let chartType = type;
    if (type === 'bar') chartType = 'bar';
    if (type === 'pie') chartType = 'pie';
    if (type === 'horizontalBar') chartType = 'bar';
    return { labels, data, chartType, horizontal: type === 'horizontalBar', rawPlayers: leaderboard };
}