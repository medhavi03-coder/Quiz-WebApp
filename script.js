// DOM Elements
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');
const restartBtn = document.getElementById('restart-btn');
const saveScoreBtn = document.getElementById('save-score-btn');
const currentQuestionEl = document.getElementById('current-question');
const totalQuestionsEl = document.getElementById('total-questions');
const progressBar = document.getElementById('progress-bar');
const questionEl = document.getElementById('question');
const optionsEl = document.getElementById('options');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const maxScoreEl = document.getElementById('max-score');
const correctAnswersEl = document.getElementById('correct-answers');
const totalAnswersEl = document.getElementById('total-answers');
const playerNameInput = document.getElementById('player-name');
const leaderboardList = document.getElementById('leaderboard-list');
const themeToggle = document.getElementById('theme-toggle');

// Quiz state
let quizData = [];
let currentQuestion = 0;
let score = 0;
let selectedOption = null;
let quizComplete = false;
let timerInterval = null;
let timeLeft = 15;

// Fetch questions from questions.json
async function fetchQuestions() {
    try {
        const response = await fetch('questions.json');
        quizData = await response.json();
        
        // Update UI with total questions
        totalQuestionsEl.textContent = quizData.length;
        maxScoreEl.textContent = quizData.length;
        totalAnswersEl.textContent = quizData.length;
    } catch (error) {
        console.error('Error loading questions:', error);
        // Fallback to empty array if questions can't be loaded
        quizData = [];
        alert('Error loading questions. Please try refreshing the page.');
    }
}

// Initialize quiz
async function initQuiz() {
    // Load questions
    await fetchQuestions();
    
    console.log("Initializing quiz...");

    if (!startBtn || !nextBtn || !restartBtn || !saveScoreBtn || !themeToggle) {
        console.error("One or more buttons not found in the DOM!");
        return;
    }

    startBtn.addEventListener('click', startQuiz);
    nextBtn.addEventListener('click', nextQuestion);
    restartBtn.addEventListener('click', restartQuiz);
    saveScoreBtn.addEventListener('click', saveScore);
    themeToggle.addEventListener('click', toggleTheme);

    fetchQuestions().then(() => displayLeaderboard());
}

// Start the quiz
function startQuiz() {
    // Check if questions were loaded
    if (quizData.length === 0) {
        alert('No questions available. Please try refreshing the page.');
        return;
    }
    
    startScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    
    // Reset quiz state
    currentQuestion = 0;
    score = 0;
    quizComplete = false;
    
    // Load first question
    loadQuestion();
}

// Load question and options
function loadQuestion() {
    // Reset state for new question
    selectedOption = null;
    nextBtn.disabled = true;
    
    // Reset timer
    clearInterval(timerInterval);
    timeLeft = 15;
    timerEl.textContent = timeLeft;
    timerEl.style.backgroundColor = 'var(--timer-bg)';
    timerEl.style.color = 'white';
    startTimer();
    
    // Update progress
    currentQuestionEl.textContent = currentQuestion + 1;
    const progressPercentage = ((currentQuestion) / quizData.length) * 100;
    progressBar.style.width = `${progressPercentage}%`;
    
    // Load question and options
    const currentQuizData = quizData[currentQuestion];
    questionEl.textContent = currentQuizData.question;
    
    // Clear and rebuild options
    optionsEl.innerHTML = '';
    currentQuizData.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.classList.add('option');
        optionElement.textContent = option;
        optionElement.setAttribute('data-index', index);
        optionElement.addEventListener('click', selectOption);
        optionsEl.appendChild(optionElement);
    });
}

// Select an option
function selectOption(e) {
    // Return if quiz is complete or an option was already selected
    if (quizComplete || selectedOption !== null) return;
    
    // Clear timer
    clearInterval(timerInterval);
    
    // Get selected option
    const selectedEl = e.target;
    selectedOption = parseInt(selectedEl.getAttribute('data-index'));
    
    // Mark selected option
    selectedEl.classList.add('selected');
    
    // Check if answer is correct
    const currentQuizData = quizData[currentQuestion];
    if (selectedOption === currentQuizData.correctAnswer) {
        selectedEl.classList.add('correct');
        score++;
    } else {
        selectedEl.classList.add('incorrect');
        
        // Show correct answer
        const correctEl = document.querySelector(`.option[data-index="${currentQuizData.correctAnswer}"]`);
        correctEl.classList.add('correct');
    }
    
    // Enable next button
    nextBtn.disabled = false;
}

// Move to next question or show results
function nextQuestion() {
    currentQuestion++;
    
    if (currentQuestion < quizData.length) {
        loadQuestion();
    } else {
        showResults();
    }
}

// Show quiz results
function showResults() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    
    // Update results
    scoreEl.textContent = score;
    correctAnswersEl.textContent = score;
    
    // Mark quiz as complete
    quizComplete = true;
}

// Restart the quiz
function restartQuiz() {
    resultScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    
    // Reset quiz state
    currentQuestion = 0;
    score = 0;
    quizComplete = false;
    
    // Reset name form visibility
    document.getElementById('name-form').classList.remove('hidden');
    playerNameInput.value = '';
    
    // Load first question
    loadQuestion();
}

// Timer function
function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;
        
        if (timeLeft <= 5) {
            timerEl.style.color = 'white';
            timerEl.style.backgroundColor = 'var(--danger-color)';
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            
            // Auto-select incorrect option if none selected
            if (selectedOption === null) {
                // Show correct answer
                const currentQuizData = quizData[currentQuestion];
                const correctEl = document.querySelector(`.option[data-index="${currentQuizData.correctAnswer}"]`);
                correctEl.classList.add('correct');
                
                // Enable next button
                nextBtn.disabled = false;
            }
        }
    }, 1000);
}

// Save score to leaderboard
function saveScore() {
    const playerName = playerNameInput.value.trim();
    if (!playerName) {
        alert('Please enter your name to save your score.');
        return;
    }
    
    // Get existing leaderboard or create new one
    const leaderboard = JSON.parse(localStorage.getItem('quizLeaderboard')) || [];
    
    // Add new score
    leaderboard.push({
        name: playerName,
        score: score,
        date: new Date().toLocaleDateString()
    });
    
    // Sort leaderboard by score (highest first)
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Keep only top 10 scores
    const top10 = leaderboard.slice(0, 10);
    
    // Save to local storage
    localStorage.setItem('quizLeaderboard', JSON.stringify(top10));
    
    // Update display
    displayLeaderboard();
    
    // Hide the form
    document.getElementById('name-form').classList.add('hidden');
}

// Display leaderboard
function displayLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem('quizLeaderboard')) || [];
    
    // Clear current leaderboard
    leaderboardList.innerHTML = '';
    
    if (leaderboard.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.classList.add('leaderboard-item');
        emptyItem.textContent = 'No scores yet. Be the first!';
        leaderboardList.appendChild(emptyItem);
        return;
    }
    
    // Add leaderboard items
    leaderboard.forEach((entry, index) => {
        const item = document.createElement('li');
        item.classList.add('leaderboard-item');
        
        const rank = document.createElement('span');
        rank.textContent = `${index + 1}.`;
        
        const name = document.createElement('span');
        name.textContent = entry.name;
        
        const scoreDisplay = document.createElement('span');
        scoreDisplay.textContent = `${entry.score}/${quizData.length} - ${entry.date}`;
        
        item.appendChild(rank);
        item.appendChild(name);
        item.appendChild(scoreDisplay);
        
        leaderboardList.appendChild(item);
    });
}

// Toggle dark/light theme
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
}

// Initialize the quiz when page loads
document.addEventListener('DOMContentLoaded', initQuiz);