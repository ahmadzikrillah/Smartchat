// ================ [1] INITIALIZATION ================ //
let dataset; // Variabel global untuk menyimpan data
const sessionContext = {
    currentTopic: null,
    lastSubtopic: null,
    conversationHistory: []
};

// Fungsi untuk menangani error saat gambar ada (siap) atau tidak
function handleImageLoadError(imgElement, defaultSrc = null) {
    imgElement.onload = () => {
        console.log(`Gambar berhasil dimuat: ${imgElement.src}`);
        // Anda dapat menambahkan logika tambahan di sini jika perlu
    };

    imgElement.onerror = () => {
        console.error(`Gagal memuat gambar: ${imgElement.src}`);
        if (defaultSrc) {
            imgElement.src = defaultSrc;
            console.log(`Menggunakan gambar default: ${defaultSrc}`);
        } else {
            imgElement.style.display = 'none';
            console.warn('Tidak ada gambar default yang ditentukan.');
        }
    };
}

// Fungsi untuk memuat database dengan penanganan error lebih robust
async function loadDatabase() {
    // Tampilkan indikator loading
    addMessage(`<div class="loading-message">Memuat database pembelajaran...</div>`);

    try {
        // Coba load dari cache localStorage terlebih dahulu
        const cachedData = localStorage.getItem('cachedDatabase');
        if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            if (validateDatabaseStructure(parsedData)) {
                dataset = parsedData;
                console.log("Menggunakan data dari cache");
                return;
            }
        }

        // Load data terbaru dari server
        const response = await fetch('database.json?_=' + new Date().getTime());

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const freshData = await response.json();

        // Validasi struktur data
        if (!validateDatabaseStructure(freshData)) {
            throw new Error("Struktur database tidak valid");
        }

        dataset = freshData;

        // Simpan ke cache
        localStorage.setItem('cachedDatabase', JSON.stringify(freshData));
        console.log("Database loaded successfully");

    } catch (error) {
        console.error("Error loading database:", error);
        useFallbackData(error);
    } finally {
        preloadDefaultImages();
    }
}

// Pindahkan fungsi-fungsi helper ke luar dari loadDatabase
function validateDatabaseStructure(data) {
    return data &&
           data.topics &&
           typeof data.topics === 'object' &&
           Object.keys(data.topics).length > 0;
}

function useFallbackData(error) {
    addMessage(`<div class="error-message">Terjadi kesalahan saat memuat data: ${error.message}. Menggunakan data dasar.</div>`);
    dataset = {
        "topics": {
            "Contoh": {
                "description": "Contoh Data Dasar",
                "subtopics": {
                    "Sapaan": {
                        "description": "Sapaan sederhana",
                        "QnA": [
                            {
                                "patterns": ["halo", "hai"],
                                "responses": ["Halo juga!", "Hai! Ada yang bisa saya bantu?"]
                            }
                        ]
                    }
                }
            }
        }
    };
}

function preloadDefaultImages() {
    const defaultImages = [
        'images/default-cell.png',
        'images/default-teacher.png'
    ];

    defaultImages.forEach(imgUrl => {
        const img = new Image();
        handleImageLoadError(img); // Terapkan handler (tanpa default, hanya log error)
        img.src = imgUrl;
    });
}

// ================ [2] TEXT PROCESSING ================ //
function normalizeText(text) {
    if (!text) return '';
    return text.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/g, '')
        .replace(/\b(apa|bagaimana|mengapa|tolong|jelaskan|sebutkan)\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenize(text) {
    return normalizeText(text).split(' ').filter(word => word.length > 2);
}

// ================ [3] ENHANCED MATCHING ENGINE ================ //
function calculateMatchScore(query, pattern) {
    const queryTokens = new Set(tokenize(query));
    const patternTokens = new Set(tokenize(pattern));

    const intersection = new Set([...queryTokens].filter(t => patternTokens.has(t)));
    const union = new Set([...queryTokens, ...patternTokens]);
    let score = intersection.size / union.size;

    if (sessionContext.currentTopic && pattern.includes(sessionContext.currentTopic)) {
        score *= 1.3;
    }

    const questionTypes = {
        'apa': 1.2,
        'bagaimana': 1.15,
        'mengapa': 1.1
    };
    for (const [type, bonus] of Object.entries(questionTypes)) {
        if (query.includes(type) && pattern.includes(type)) {
            score *= bonus;
            break;
        }
    }

    return Math.min(score, 1.0);
}

function findBestMatch(query) {
    if (!dataset?.topics) {
        console.warn("Data belum dimuat!");
        return null;
    }

    const normalizedQuery = normalizeText(query);
    let bestMatch = { score: 0 };

    // Priority 1: Check current topic first
    if (sessionContext.currentTopic && dataset.topics[sessionContext.currentTopic]) {
        const topicData = dataset.topics[sessionContext.currentTopic];
        for (const [subtopic, subtopicData] of Object.entries(topicData.subtopics)) {
            for (const qna of subtopicData.QnA) {
                for (const pattern of qna.patterns) {
                    const score = calculateMatchScore(normalizedQuery, pattern);
                    if (score > bestMatch.score) {
                        bestMatch = {
                            score,
                            topic: sessionContext.currentTopic,
                            subtopic,
                            response: qna.responses[Math.floor(Math.random() * qna.responses.length)],
                            diagram: qna.diagram
                        };
                    }
                }
            }
        }

        if (bestMatch.score > 0.7) return bestMatch;
    }

    // Priority 2: Global search
    for (const [topic, topicData] of Object.entries(dataset.topics)) {
        for (const [subtopic, subtopicData] of Object.entries(topicData.subtopics)) {
            for (const qna of subtopicData.QnA) {
                for (const pattern of qna.patterns) {
                    const score = calculateMatchScore(normalizedQuery, pattern);
                    if (score > bestMatch.score) {
                        bestMatch = {
                            score,
                            topic,
                            subtopic,
                            response: qna.responses[Math.floor(Math.random() * qna.responses.length)],
                            diagram: qna.diagram
                        };
                    }
                }
            }
        }
    }

    return bestMatch.score > 0.6 ? bestMatch : null;
}

// ================ [4] RESPONSE MANAGEMENT ================ //
async function formatResponse(match) {
    if (!match) return '';

    // Handle khusus untuk profil guru
    if (match.topic === "Profil Guru") {
        const imageUrl = match.diagram || 'images/default-guru.png';
        const imgElement = document.createElement('img');
        imgElement.id = 'guruFoto';
        imgElement.alt = 'Foto Guru';
        handleImageLoadError(imgElement, 'images/default-guru.png'); // Terapkan handler
        imgElement.src = imageUrl; // Set sumber setelah handler

        return `
            <div class="answer-box">
                <div class="topic-header">
                    <span class="topic">${match.topic}</span>
                    <span class="subtopic">${match.subtopic}</span>
                </div>
                <div class="guru-profile">
                    ${imgElement.outerHTML} <div class="guru-info">
                        <p>${match.response}</p>
                    </div>
                </div>
                <div class="feedback-buttons">
                    <button onclick="handleFeedback(this, 'up')">👍</button>
                    <button onclick="handleFeedback(this, 'down')">👎</button>
                </div>
            </div>
        `;
    }

    let html = `
        <div class="answer-box">
            <div class="topic-header">
                <span class="topic">${match.topic}</span>
                <span class="subtopic">${match.subtopic}</span>
                ${sessionContext.currentTopic === match.topic ?
                    '<span class="context-badge">(Topik Terkait)</span>' : ''}
            </div>
            <div class="answer-content">${match.response}</div>
    `;

    if (match.diagram) {
        const imageExists = await checkImageExists(match.diagram);
        if (imageExists) {
            const imgElement = document.createElement('img');
            imgElement.src = match.diagram;
            imgElement.alt = match.subtopic;
            handleImageLoadError(imgElement); // Terapkan handler
            html += `<div class="diagram">${imgElement.outerHTML}</div>`;
        }
    }

    html += `
        <div class="feedback-buttons">
            <button onclick="handleFeedback(this, 'up')">👍</button>
            <button onclick="handleFeedback(this, 'down')">👎</button>
        </div>
    </div>`;

    return html;
}

async function checkImageExists(url) {
    try {
        const res = await fetch(url, { method: 'HEAD' });
        return res.ok;
    } catch {
        return false;
    }
}

function getFallbackResponse() {
    if (sessionContext.currentTopic && dataset.topics[sessionContext.currentTopic]) {
        const subtopics = Object.keys(dataset.topics[sessionContext.currentTopic].subtopics);
        return `
            <div class="not-found">
                <p>Dalam topik <strong>${sessionContext.currentTopic}</strong>, coba tanyakan:</p>
                <ul>${subtopics.map(st => `<li>${st}</li>`).join('')}</ul>
            </div>`;
    }

    const topics = Object.keys(dataset.topics);
    return `
        <div class="not-found">
            <p>Coba tanyakan salah satu topik berikut:</p>
            <ul>${topics.map(t => `<li>${t}</li>`).join('')}</ul>
        </div>`;
}

// ================ [5] CHAT INTERFACE ================ //
function addMessage(content, isBot = true) {
    const chatbox = document.getElementById('chatbox');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isBot ? 'bot-message' : 'user-message'}`;
    messageDiv.innerHTML = content;
    chatbox.appendChild(messageDiv);
    chatbox.scrollTop = chatbox.scrollHeight;
}

// ================ [5.5] USER INPUT PROCESSING ================ //
async function processUserInput() {
    const userInputElement = document.getElementById('userInput');
    const userQuery = userInputElement.value.trim();

    if (userQuery) {
        addMessage(userQuery, false); // Tambahkan pertanyaan pengguna ke chatbox
        userInputElement.value = ''; // Bersihkan input

        const match = findBestMatch(userQuery);
        let botResponse;

        if (match) {
            botResponse = await formatResponse(match);
            sessionContext.currentTopic = match.topic;
            sessionContext.lastSubtopic = match.subtopic;
        } else {
            botResponse = getFallbackResponse();
        }

        addMessage(botResponse, true); // Tambahkan jawaban bot ke chatbox
        sessionContext.conversationHistory.push({ query: userQuery, response: botResponse });
        saveConversation();
    }
}

// ================ [6] EVENT HANDLERS ================ //
function setupEventListeners() {
    document.getElementById('sendButton').addEventListener('click', processUserInput);
    document.getElementById('userInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') processUserInput();
    });
    document.getElementById('clearChat').addEventListener('click', () => {
        document.getElementById('chatbox').innerHTML = '';
        sessionContext.currentTopic = null;
        sessionContext.lastSubtopic = null;
        sessionContext.conversationHistory = [];
        localStorage.removeItem('chatHistory');
        showWelcomeMessage();
    });
}

function showWelcomeMessage() {
    addMessage("Halo! Saya Asisten IPA. Silakan ajukan pertanyaan Anda.");
    addMessage(`
        <div class="welcome-message">
            <p><b>Contoh pertanyaan:</b></p>
            <ul>
                <li>Apa itu sel?</li>
                <li>Bagaimana proses fotosintesis?</li>
                <li>Siapa guru biologi?</li>
            </ul>
        </div>`);
}

// ================ [7] INITIALIZATION ================ //
document.addEventListener('DOMContentLoaded', async () => {
    await loadDatabase();
    setupEventListeners();
    loadConversation();
    showWelcomeMessage();
});

// ================ [8] LOCAL STORAGE ================ //
function saveConversation() {
    localStorage.setItem('chatHistory', JSON.stringify(sessionContext.conversationHistory));
}

function loadConversation() {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
        sessionContext.conversationHistory = JSON.parse(savedHistory);
        sessionContext.conversationHistory.forEach(entry => {
            addMessage(entry.query, false);
            addMessage(`<div class="answer-box">${entry.response}</div>`, true);
        });
    }
}

// ================ [9] FEEDBACK SYSTEM ================ //
function handleFeedback(button, type) {
    const answerBox = button.closest('.answer-box');
    answerBox.querySelector('.feedback-buttons').innerHTML =
        `<span>${type === 'up' ? 'Terima kasih!' : 'Akan kami perbaiki...'}</span>`;

    const feedbackData = {
        question: answerBox.querySelector('.answer-content').textContent,
        rating: type,
        timestamp: new Date()
    };

    const feedbackHistory = JSON.parse(localStorage.getItem('feedbackHistory') || '[]');
    feedbackHistory.push(feedbackData);
    localStorage.setItem('feedbackHistory', JSON.stringify(feedbackHistory));
}
