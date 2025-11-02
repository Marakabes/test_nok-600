const effectiveAllQuestions = typeof allQuestions !== 'undefined' ? allQuestions : [];
const effectiveQuestionsPerBlock = typeof questionsPerBlock !== 'undefined' ? questionsPerBlock : 20;
const effectiveTotalExpectedQuestions = typeof totalExpectedQuestions !== 'undefined' ? totalExpectedQuestions : 600;

console.log('🔍 Проверка переменных:', {
    questions: effectiveAllQuestions.length,
    perBlock: effectiveQuestionsPerBlock, 
    total: effectiveTotalExpectedQuestions
});
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
 
    const ALL_QUESTIONS_BLOCK = -1;
    const MISTAKES_REVIEW_BLOCK = -2;

function getMistakesRoundBlockId(round) {
    const result = -2 - round; // -3 для круга 1, -4 для круга 2, и т.д.
    console.log('getMistakesRoundBlockId: круг', round, '-> ID', result);
    return result;
}

    // Основные элементы
    const startScreen = document.getElementById('start-screen');
    const settingsScreen = document.getElementById('settings-screen');
    const blocksContainer = document.getElementById('blocks-container');
    const quizContainer = document.getElementById('quiz-container');
    const resultsContainer = document.getElementById('results-container');
    const finalCorrect = document.getElementById('final-correct');
    const totalQuestionsDisplay = document.getElementById('total-questions');
    const finalProgress = document.getElementById('final-progress');
    const settingsToggle = document.getElementById('settings-toggle');
    const modal = document.getElementById('modal');
    const modalMessage = document.getElementById('modal-message');
    
    const allQuestionsBtn = document.getElementById('all-questions-btn');

    // Фиксированные Элементы
    const headerElement = document.querySelector('header');
    const fixedQuizInfo = document.getElementById('fixed-quiz-info');
    const questionTextFixed = document.getElementById('question-text-fixed');
    const progressTextFixed = document.getElementById('progress-text-fixed');
    const correctCountDisplayFixed = document.getElementById('correct-count-fixed');
    const incorrectCountDisplayFixed = document.getElementById('incorrect-count-fixed');
    const optionsContainer = document.getElementById('options-container'); 

    // TTS Элементы
    const ttsToggleButton = document.getElementById('tts-toggle-button');
    const ttsReplayButton = document.getElementById('tts-replay-button'); 
    
    // NEW Settings Controls
    const settingsTtsRateSlider = document.getElementById('settings-tts-rate-slider');
    const settingsTtsRateValueDisplay = document.getElementById('settings-tts-rate-value');
    
    // НОВАЯ НАСТРОЙКА: Озвучивать ответы с вопросом
    const readOptionsWithQuestionToggle = document.getElementById('read-options-with-question-toggle'); 
    // СТАРАЯ НАСТРОЙКА (ПЕРЕИМЕНОВАННАЯ): Озвучивать правильные ответы
    const readAnswersToggle = document.getElementById('read-answers-toggle'); 
    
    const shuffleQuestionsToggle = document.getElementById('shuffle-questions-toggle');
    const shuffleOptionsToggle = document.getElementById('shuffle-options-toggle');
    const themeModeBtn = document.getElementById('theme-mode-btn');
    
    // Фиксированные футеры и кнопки
    const startFooterFixed = document.getElementById('start-footer-fixed');
    const quizFooterFixed = document.getElementById('quiz-footer-fixed');
    const resultsFooterFixed = document.getElementById('results-footer-fixed');
    const actionButton = document.getElementById('action-button'); 
    const backToMenuBtn = document.getElementById('back-to-menu-btn');
    const reviewInQuizBtn = document.getElementById('review-in-quiz-btn');
    const resetBtn = document.getElementById('reset-btn');
    const leftContextBtn = document.getElementById('left-context-btn');
    const menuButton = document.getElementById('menu-button');
    const restartButton = document.getElementById('restart-button');
    const reviewButton = document.getElementById('review-button');
    const modalConfirm = document.getElementById('modal-confirm');
    const modalCancel = document.getElementById('modal-cancel');

    // Управление состоянием
    const defaultSettings = {
        ttsVoice: '',
        readOptionsWithQuestion: false,
        readAnswers: false,
        shuffleQuestions: false,
        shuffleOptions: false,
        theme: 'light'
    };
    
let state = {
    currentView: 'start', 
    previousView: 'start', 
    isMistakesMode: false,
    currentMistakesRound: 1,
    maxMistakesRound: 1,
    currentQuiz: {
        questions: [],
        currentIndex: 0,
        answers: [], 
        correctCount: 0,
        incorrectCount: 0,
        reviewMode: false, 
        blockIndex: ALL_QUESTIONS_BLOCK 
    },
    userProgress: {}, 
    unfinishedQuizzes: {}, 
    userMistakesByBlock: {},
    mistakesFromAllQuiz: [],
    mistakesRounds: {1: []},
    ttsMode: 'off', 
    ttsRate: 1.0,  
    settings: {
        ttsVoice: '',
        readOptionsWithQuestion: false,
        readAnswers: false,
        shuffleQuestions: false,
        shuffleOptions: false,
        theme: 'light'
    }
};
    
    // --- Text-to-Speech (TTS) Logic ---
    let isSpeaking = false;
    let currentUtterance = null;
    let selectedVoice = null;

    function updateTtsButtonIcon() {
        ttsToggleButton.classList.remove('tts-off', 'tts-on');
        
        let icon = '';
        
        if (state.ttsMode === 'off') {
            ttsToggleButton.classList.add('tts-off');
            icon = '🔇'; 
            ttsToggleButton.title = 'Озвучивание: Отключено (Нажмите, чтобы включить)';
        } else { // 'on'
            ttsToggleButton.classList.add('tts-on');
            icon = '🔊'; 
            ttsToggleButton.title = 'Озвучивание: Включено (Нажмите, чтобы отключить)';
        }
        
        ttsToggleButton.textContent = icon;
        
        settingsTtsRateValueDisplay.textContent = `${state.ttsRate.toFixed(1)}x`; 
        
        updateReplayButtonVisibility(); 
    }

    function updateReplayButtonVisibility() {
        if (!ttsReplayButton) return; 
        const isQuizView = state.currentView === 'quiz';
        
        if (state.ttsMode === 'on' && isQuizView) {
            ttsReplayButton.classList.add('visible');
        } else {
            ttsReplayButton.classList.remove('visible');
        }
        
        ttsReplayButton.title = 'Повторить озвучивание';
    }
    
    function stopSpeaking() {
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
        isSpeaking = false;
        currentUtterance = null; 
        updateReplayButtonVisibility(); 
    }

    function speakText(text) {
        if (!window.speechSynthesis || !text) return;
        
        stopSpeaking(); 

        const textToSpeak = text; 
        
        currentUtterance = new SpeechSynthesisUtterance(textToSpeak); 
        currentUtterance.lang = 'ru-RU';
        currentUtterance.rate = state.ttsRate;

        currentUtterance.onstart = () => {
            isSpeaking = true;
        };

        currentUtterance.onend = () => {
            if (isSpeaking) {
                 isSpeaking = false;
                 updateReplayButtonVisibility(); 
            }
        };

        currentUtterance.onerror = (event) => {
            if (event.error !== 'interrupted') {
                 console.error('Speech synthesis error: ' + event.error);
            }
            isSpeaking = false;
            updateReplayButtonVisibility(); 
        };

        window.speechSynthesis.speak(currentUtterance);
    }
    
    function speakQuestion() {
        if (state.ttsMode === 'off') {
            return; 
        }
        
        const currentQ = state.currentQuiz.questions[state.currentQuiz.currentIndex];
        
        let textToSpeak = questionTextFixed.textContent.trim();
        
        if (state.settings.readOptionsWithQuestion) {
             const optionsText = Array.from(optionsContainer.children)
                .map((optElement) => {
                    const text = optElement.textContent.trim();
                    const indexMatch = text.match(/^(\d+\.\s*)/);
                    return indexMatch ? text.substring(indexMatch[1].length) : text;
                })
                .map((text, index) => `${index + 1}: ${text}`)
                .join('. ');

             textToSpeak += `. Варианты ответа: ${optionsText}`;
        }
        
        speakText(textToSpeak);
    }
    
    function speakAnswer(isCorrect, correctOptions) {
        if (state.ttsMode === 'off' || !state.settings.readAnswers || isCorrect) {
            return; 
        }
        
        let text = 'Ответ неправильный.';

        const numberedCorrectOptions = correctOptions
            .map((text, index) => ` ${index + 1}: ${text}`) 
            .join('. ');

        text += ` Правильные варианты: ${numberedCorrectOptions}.`;
        
        speakText(text);
    }
    
function toggleTtsMode() {
    stopSpeaking(); 
    
    if (state.ttsMode === 'off') {
        state.ttsMode = 'on';
    } else { 
        state.ttsMode = 'off';
    }
    
    saveState();
    updateTtsButtonIcon(); 
    updateQuizPadding();
    
    if (state.ttsMode === 'on' && state.currentView === 'quiz') {
         speakQuestion();
    }
    
    updateReplayButtonVisibility(); 
}
    
    // --- End TTS Logic ---

    // --- Local Storage Functions ---


    
    function loadTheme(theme) {
        state.settings.theme = theme;
        const isDark = theme === 'dark';
        if (isDark) {
            document.body.classList.add('dark-theme');
            themeModeBtn.textContent = '⚪ Темная';
        } else {
            document.body.classList.remove('dark-theme');
            themeModeBtn.textContent = '⚫ Светлая';
        }
    }
    
    // --- Dynamic Padding Function ---
    const SCROLL_BUFFER = 80; 

    function updateQuizPadding() {
        const root = document.documentElement;
        
        let totalHeaderHeight = headerElement.offsetHeight;
        
        if (!fixedQuizInfo.classList.contains('hidden')) {
             totalHeaderHeight = headerElement.offsetHeight; 
        }

        let actualFooterHeight = 0;
        if (!quizFooterFixed.classList.contains('hidden')) {
            actualFooterHeight = quizFooterFixed.offsetHeight;
        } else if (!startFooterFixed.classList.contains('hidden')) {
            actualFooterHeight = startFooterFixed.offsetHeight;
        } else if (!resultsFooterFixed.classList.contains('hidden')) {
            actualFooterHeight = resultsFooterFixed.offsetHeight;
        }
        
        root.style.setProperty('--dynamic-header-height', `${totalHeaderHeight}px`);
        root.style.setProperty('--dynamic-footer-height-actual', `${actualFooterHeight}px`); 
        root.style.setProperty('--scroll-buffer-height', `${SCROLL_BUFFER}px`); 
    }

    // --- Quiz Setup and Navigation ---

function initBlocks() {
    blocksContainer.innerHTML = '';
    
    console.log('=== initBlocks ===');
    console.log('isMistakesMode:', state.isMistakesMode, 'currentMistakesRound:', state.currentMistakesRound);
    console.log('unfinishedQuizzes keys:', Object.keys(state.unfinishedQuizzes));
    
    // Логируем все незавершенные тесты
    Object.keys(state.unfinishedQuizzes).forEach(key => {
        const quiz = state.unfinishedQuizzes[key];
        console.log(`Незавершенный тест ${key}: ${quiz.currentIndex}/${quiz.questions.length}, reviewMode: ${quiz.reviewMode}`);
    });
    
    if (state.isMistakesMode) {
        console.log('✅ Режим ошибок, круг:', state.currentMistakesRound);
        
        const titleElement = document.querySelector('#start-screen h2');
        titleElement.textContent = `Круг ${state.currentMistakesRound} ошибок`;
        
        const currentRoundMistakes = state.mistakesRounds[state.currentMistakesRound] || [];
        console.log('Ошибки текущего круга:', currentRoundMistakes.length);
        
        const totalMistakeBlocks = Math.ceil(currentRoundMistakes.length / effectiveQuestionsPerBlock);
        console.log('Всего блоков в круге:', totalMistakeBlocks);
        
        for (let i = 0; i < totalMistakeBlocks; i++) {
            const blockButton = document.createElement('button');
            blockButton.classList.add('block-button');
            
            const startQ = i * effectiveQuestionsPerBlock + 1;
            const endQ = Math.min((i + 1) * effectiveQuestionsPerBlock, currentRoundMistakes.length);
            
            const baseBlockId = getMistakesRoundBlockId(state.currentMistakesRound);
            const blockType = (baseBlockId * 100) - (i + 1);
            
            let progressText = '';
            const progress = state.userProgress[blockType];
            const unfinished = state.unfinishedQuizzes[blockType];
            
            console.log(`Блок ${i} (ID:${blockType}): unfinished=`, unfinished);
            
            if (unfinished && unfinished.currentIndex < unfinished.questions.length) {
                progressText = ` (${unfinished.currentIndex}/${unfinished.questions.length})`;
                blockButton.style.backgroundColor = 'var(--button-next-bg)';
                console.log(`✅ Блок ${i} - НЕЗАВЕРШЕННЫЙ:`, progressText);
            } else if (progress) {
                progressText = ` (✔${progress.correct}/${progress.total})`;
                blockButton.style.backgroundColor = 'var(--button-submit-bg)';
                console.log(`✅ Блок ${i} - завершенный:`, progressText);
            } else {
                blockButton.style.backgroundColor = 'var(--button-danger-bg)';
                console.log(`✅ Блок ${i} - не начат`);
            }

            blockButton.innerHTML = `${startQ}-${endQ}${progressText}`;
            blockButton.onclick = () => startMistakesBlock(i);
            blocksContainer.appendChild(blockButton);
        }
        
        if (currentRoundMistakes.length === 0) {
            const noMistakesMsg = document.createElement('div');
            noMistakesMsg.className = 'no-mistakes-message';
            noMistakesMsg.innerHTML = `В ${state.currentMistakesRound} круге пока нет ошибок!`;
            noMistakesMsg.style.textAlign = 'center';
            noMistakesMsg.style.padding = '2rem';
            noMistakesMsg.style.color = 'var(--text-color)';
            blocksContainer.appendChild(noMistakesMsg);
        }
        
    } else {


        // Показываем обычные блоки вопросов
        document.querySelector('#start-screen h2').textContent = 'Выберите блок вопросов';
        
        const totalBlocks = Math.ceil(effectiveTotalExpectedQuestions / effectiveQuestionsPerBlock);

        for (let i = 0; i < totalBlocks; i++) {
            const blockButton = document.createElement('button');
            blockButton.classList.add('block-button');
            
            const startQ = i * effectiveQuestionsPerBlock + 1;
            const endQ = Math.min((i + 1) * effectiveQuestionsPerBlock, effectiveAllQuestions.length);
            
            let progressText = '';
            const progress = state.userProgress[i];
            
            const unfinished = state.unfinishedQuizzes[i];
            if (unfinished && unfinished.currentIndex < unfinished.questions.length) {
                progressText = ` (${unfinished.currentIndex}/${unfinished.questions.length})`;
                blockButton.style.backgroundColor = 'var(--button-next-bg)';
            } else if (progress) {
                progressText = ` (✔${progress.correct}/${progress.total})`;
                blockButton.style.backgroundColor = 'var(--button-submit-bg)';
            }

            blockButton.innerHTML = `${startQ}-${endQ}${progressText}`;
            
            if (startQ >effectiveAllQuestions.length) {
                blockButton.disabled = true;
                blockButton.style.opacity = '0.6';
                blockButton.style.cursor = 'default';
                blockButton.title = 'Вопросы пока не добавлены';
            } else {
                blockButton.onclick = () => startQuiz(effectiveQuestionsPerBlock, i);
            }

            blocksContainer.appendChild(blockButton);
        }
    }

    // Обновление кнопки "Все вопросы"
    const unfinishedAll = state.unfinishedQuizzes[ALL_QUESTIONS_BLOCK];
    if (unfinishedAll && unfinishedAll.currentIndex < unfinishedAll.questions.length) {
        allQuestionsBtn.textContent = `Решить все 600 (${unfinishedAll.currentIndex}/${unfinishedAll.questions.length})`;
        allQuestionsBtn.style.backgroundColor = 'var(--button-next-bg)';
    } else {
        allQuestionsBtn.textContent = `Решить все 600`;
        allQuestionsBtn.style.backgroundColor = 'var(--button-submit-bg)';
    }
}

function startMistakesBlock(blockIndex) {
    const currentRoundMistakes = state.mistakesRounds[state.currentMistakesRound] || [];
    const startIndex = blockIndex * effectiveQuestionsPerBlock;
    const endIndex = Math.min((blockIndex + 1) * effectiveQuestionsPerBlock, currentRoundMistakes.length);
    const blockMistakes = currentRoundMistakes.slice(startIndex, endIndex);
    
    console.log('startMistakesBlock: круг', state.currentMistakesRound, 'блок', blockIndex, 'вопросов:', blockMistakes.length);
    
    if (blockMistakes.length > 0) {
        const baseBlockId = getMistakesRoundBlockId(state.currentMistakesRound);
        const blockType = (baseBlockId * 100) - (blockIndex + 1);
        
        console.log('Уникальный ID блока:', blockType, 'для круга', state.currentMistakesRound, 'блока', blockIndex);
        
        // Сохраняем вопросы этого блока ошибок
        state.userMistakesByBlock[blockType] = [...blockMistakes];
        
        // ИСПРАВЛЕНИЕ: Убираем review = true для сохранения прогресса
        startQuiz(blockMistakes.length, blockType, false, blockMistakes); // false вместо true
    }
}

function switchToMistakesMode() {
    // ВМЕСТО: state.isMistakesMode = true;
    // СРАЗУ ОТКРЫВАЕМ ПЕРВЫЙ КРУГ
    state.currentMistakesRound = 1;
    state.isMistakesMode = true;
    
    // Инициализируем mistakesRounds если не существует
    if (!state.mistakesRounds) {
        state.mistakesRounds = {1: []};
    }
    
    saveState();
    initBlocks();
    updateMistakesCount();
}

function getCurrentRoundMistakes() {
    if (!state.mistakesRounds) {
        state.mistakesRounds = {1: []};
    }
    return state.mistakesRounds[state.currentMistakesRound] || [];
}

function updateMistakesCount() {
    // Обновляем левую кнопку в зависимости от контекста
    updateLeftContextButton();
    
    // Обновляем кнопку "Решить все 600" если есть незавершенный тест
    const unfinishedAll = state.unfinishedQuizzes[ALL_QUESTIONS_BLOCK];
    if (unfinishedAll && unfinishedAll.currentIndex < unfinishedAll.questions.length) {
        allQuestionsBtn.textContent = `Решить все 600 (${unfinishedAll.currentIndex}/${unfinishedAll.questions.length})`;
        allQuestionsBtn.style.backgroundColor = 'var(--button-next-bg)';
    } else {
        allQuestionsBtn.textContent = `Решить все 600`;
        allQuestionsBtn.style.backgroundColor = 'var(--button-submit-bg)';
    }
}

function updateLeftContextButton() {
    const round1Mistakes = state.mistakesRounds[1] || [];
    
    if (state.isMistakesMode) {
        // В режиме ошибок - проверяем есть ли следующий круг
        const nextRound = state.currentMistakesRound + 1;
        const nextRoundMistakes = state.mistakesRounds[nextRound] || [];
        
        console.log('Текущий круг:', state.currentMistakesRound, 'следующий круг:', nextRound, 'ошибок в следующем:', nextRoundMistakes.length);
        
        if (nextRoundMistakes.length > 0 && nextRound <= state.maxMistakesRound) {
            // Есть следующий круг - кнопка ведет к нему
            leftContextBtn.textContent = `Ошибки ${nextRound} круг (${nextRoundMistakes.length})`;
            leftContextBtn.style.backgroundColor = 'var(--button-danger-bg)';
            leftContextBtn.onclick = () => switchToRound(nextRound);
            console.log('Кнопка настроена на круг', nextRound);
        } else {
            // Следующего круга нет - кнопка ведет на главный
            leftContextBtn.textContent = 'Все вопросы';
            leftContextBtn.style.backgroundColor = 'var(--button-submit-bg)';
            leftContextBtn.onclick = backToMainScreen;
            console.log('Кнопка настроена на главный экран');
        }
        
        leftContextBtn.disabled = false;
        leftContextBtn.style.opacity = '1';
        
    } else {
        // На главном экране
        if (round1Mistakes.length > 0) {
            // Если есть ошибки - кнопка ведет к кругу 1
            leftContextBtn.textContent = `Мои ошибки (${round1Mistakes.length})`;
            leftContextBtn.style.backgroundColor = 'var(--button-next-bg)';
            leftContextBtn.onclick = switchToMistakesMode;
            leftContextBtn.disabled = false;
            leftContextBtn.style.opacity = '1';
        } else {
            // Если нет ошибок - кнопка неактивна
            leftContextBtn.textContent = 'Все вопросы';
            leftContextBtn.style.backgroundColor = 'var(--button-submit-bg)';
            leftContextBtn.onclick = () => {};
            leftContextBtn.disabled = true;
            leftContextBtn.style.opacity = '0.6';
        }
    }
}

function switchToRound(roundNumber) {
    const roundMistakes = state.mistakesRounds[roundNumber] || [];
    
    if (roundMistakes.length === 0) {
        showModal(`В ${roundNumber} круге нет ошибок!`, 'alert');
        return;
    }
    
    // Переключаемся на выбранный круг
    state.currentMistakesRound = roundNumber;
    state.isMistakesMode = true;
    
    saveState();
    initBlocks();
    updateMistakesCount();
}

function backToMainScreen() {
    state.isMistakesMode = false;
    state.currentMistakesRound = 1;
    
    saveState();
    initBlocks();
    updateMistakesCount();
}

function startQuiz(totalQuestions, blockIndex, review = false, questionsList = null) {
    stopSpeaking(); 
    
    let questions = [];
    let startingIndex = 0;
    const quizKey = blockIndex;
    const savedQuiz = state.unfinishedQuizzes[quizKey];
    
    // ИСПРАВЛЕНИЕ: Проверяем незавершенные тесты для ВСЕХ типов блоков
    // Для блоков ошибок review может быть false
    if ((!review || (blockIndex < -100 && blockIndex > -1000)) && 
        savedQuiz && savedQuiz.currentIndex < savedQuiz.questions.length) {
        state.currentQuiz = savedQuiz;
        state.currentView = 'quiz';
        console.log('✅ Восстановлен незавершенный тест для блока:', quizKey, 
                   'прогресс:', savedQuiz.currentIndex + '/' + savedQuiz.questions.length);
        renderView();
        return;
    }

    if (questionsList && questionsList.length > 0) { 
        questions = questionsList;
        if (questions.length > 1 && state.settings.shuffleQuestions) {
            shuffleArray(questions);
        }
    } else if (blockIndex !== ALL_QUESTIONS_BLOCK) { 
        questions = getBlockQuestions(blockIndex);
        
        if (questions.length === 0) {
             showModal('Этот блок пока пуст. Пожалуйста, добавьте вопросы.', 'alert');
             return;
        }
    } else { 
        if (state.settings.shuffleQuestions) {
            questions = [...effectiveAllQuestions];
            shuffleArray(questions);
        } else {
            questions = [...effectiveAllQuestions];
        }
        
        if (questions.length === 0) {
             showModal('Вопросы еще не добавлены.', 'alert');
             return;
        }
    }

    // Инициализируем currentSessionMistakes
    let currentSessionMistakes = [];
    if (questionsList) {
        currentSessionMistakes = [...questionsList];
    } else if (blockIndex === MISTAKES_REVIEW_BLOCK || blockIndex <= -3 || (blockIndex < -100 && blockIndex > -1000)) {
        // Для блоков ошибок начинаем с полного списка ошибок
        if (blockIndex === MISTAKES_REVIEW_BLOCK) {
            currentSessionMistakes = [...(state.mistakesRounds[1] || [])];
        } else {
            const round = getRoundFromBlockId(blockIndex);
            currentSessionMistakes = [...(state.mistakesRounds[round] || [])];
        }
    }
    
    state.currentQuiz = {
        questions: questions,
        currentIndex: startingIndex,
        answers: [],
        correctCount: 0,
        incorrectCount: 0,
        reviewMode: review,
        blockIndex: blockIndex,
        currentSessionMistakes: currentSessionMistakes
    };
    
    state.currentView = 'quiz';
    
    // ИСПРАВЛЕНИЕ: Сохраняем незавершенные тесты для ВСЕХ типов блоков
    // Для блоков ошибок review может быть false
    if (!review || (blockIndex < -100 && blockIndex > -1000)) {
         state.unfinishedQuizzes[quizKey] = state.currentQuiz;
         console.log('✅ Сохранен незавершенный тест для блока:', quizKey, 
                    'вопросов:', questions.length);
    }

    saveState();
    renderView();
}

// Новая функция для перемешивания вопросов между блоками
function shuffleQuestionsBetweenBlocks() {
    // Создаем копию всех вопросов
    const allQuestionsCopy = [...effectiveAllQuestions];
    
    // Перемешиваем все вопросы
    shuffleArray(allQuestionsCopy);
    
    // Распределяем перемешанные вопросы по блокам
    const totalBlocks = Math.ceil(effectiveTotalExpectedQuestions / effectiveQuestionsPerBlock);
    const shuffledQuestionsByBlock = {};
    
    for (let i = 0; i < totalBlocks; i++) {
        const startIndex = i * effectiveQuestionsPerBlock;
        const endIndex = Math.min((i + 1) * effectiveQuestionsPerBlock, allQuestionsCopy.length);
        shuffledQuestionsByBlock[i] = allQuestionsCopy.slice(startIndex, endIndex);
    }
    
    return shuffledQuestionsByBlock;
}

// Функция для получения вопросов блока с учетом перемешивания
function getBlockQuestions(blockIndex) {
    if (state.settings.shuffleQuestions) {
        // Если перемешивание включено, используем перемешанные вопросы
        if (!state.shuffledQuestions) {
            state.shuffledQuestions = shuffleQuestionsBetweenBlocks();
        }
        return state.shuffledQuestions[blockIndex] || [];
    } else {
        // Если перемешивание выключено, возвращаем вопросы в исходном порядке
        const startIndex = blockIndex * effectiveQuestionsPerBlock;
        const endIndex = Math.min((blockIndex + 1) * effectiveQuestionsPerBlock, effectiveAllQuestions.length); // ← ЗДЕСЬ ИСПРАВЛЕНИЕ
        return allQuestions.slice(startIndex, endIndex);
    }
}
    
    function openSettings() {
        stopSpeaking();
        
        if (state.currentView !== 'settings') {
             state.previousView = state.currentView;
        }
        
        state.currentView = 'settings';
        
        loadTheme(state.settings.theme);
        readAnswersToggle.checked = state.settings.readAnswers;
        readOptionsWithQuestionToggle.checked = state.settings.readOptionsWithQuestion;
        shuffleQuestionsToggle.checked = state.settings.shuffleQuestions;
        shuffleOptionsToggle.checked = state.settings.shuffleOptions;
        
        settingsTtsRateSlider.value = state.ttsRate;
        settingsTtsRateValueDisplay.textContent = `${state.ttsRate.toFixed(1)}x`;
        
         renderView();
    }
    
    function returnFromSettings() {
        stopSpeaking();
        
        const returnView = state.previousView;

        if (returnView === 'quiz') {
            state.currentView = 'quiz';
            renderView();
        } else if (returnView === 'results') {
            state.currentView = 'results';
            renderView();
        } else {
            resetStateToMenu();
            renderView();
        }
    }

function resetStateToMenu() {
    stopSpeaking(); 
    
    const quiz = state.currentQuiz;
    
    // Сохраняем режим ошибок перед сбросом
    const currentIsMistakesMode = state.isMistakesMode;
    const currentMistakesRound = state.currentMistakesRound;
    
    // ВАЖНО: Сохраняем незавершенный тест для ВСЕХ типов блоков
    if (quiz.currentIndex < quiz.questions.length && !quiz.reviewMode) {
        state.unfinishedQuizzes[quiz.blockIndex] = {
            ...quiz,
            currentSessionMistakes: quiz.currentSessionMistakes || []
        };
        console.log('✅ Сохранен незавершенный тест для блока:', quiz.blockIndex, 
                   'прогресс:', quiz.currentIndex + '/' + quiz.questions.length,
                   'reviewMode:', quiz.reviewMode);
    } else {
        console.log('ℹ️ Тест не сохранен - завершен или review mode:', 
                   'прогресс:', quiz.currentIndex + '/' + quiz.questions.length,
                   'reviewMode:', quiz.reviewMode);
    }
    
    state.currentView = 'start';
    
    state.currentQuiz = {
        questions: [], currentIndex: 0, answers: [], correctCount: 0, incorrectCount: 0, reviewMode: false, blockIndex: ALL_QUESTIONS_BLOCK
    };
    
    // Восстанавливаем режим ошибок
    state.isMistakesMode = currentIsMistakesMode;
    state.currentMistakesRound = currentMistakesRound;
    
    saveState();
    initBlocks(); // Обновляем блоки
}
    
function renderView() {
    startScreen.classList.add('hidden');
    quizContainer.classList.add('hidden');
    resultsContainer.classList.add('hidden');
    settingsScreen.classList.add('hidden'); 
    
    startFooterFixed.classList.add('hidden');
    quizFooterFixed.classList.add('hidden');
    resultsFooterFixed.classList.add('hidden');
    
    fixedQuizInfo.classList.add('hidden');
    
    stopSpeaking(); 
    
    updateTtsButtonIcon();
    
    if (state.currentView === 'start') {
        startScreen.classList.remove('hidden');
        startFooterFixed.classList.remove('hidden'); 
        
        if (!state.isMistakesMode) {
            state.currentQuiz = {
                questions: [], currentIndex: 0, answers: [], correctCount: 0, incorrectCount: 0, reviewMode: false, blockIndex: ALL_QUESTIONS_BLOCK
            };
        }

        const titleElement = document.querySelector('#start-screen h2');
        if (state.isMistakesMode) {
            titleElement.textContent = `Круг ${state.currentMistakesRound} ошибок`;
        } else {
            titleElement.textContent = 'Выберите блок вопросов';
        }

    } else if (state.currentView === 'quiz') {
        quizContainer.classList.remove('hidden');
        quizFooterFixed.classList.remove('hidden'); 
        fixedQuizInfo.classList.remove('hidden');
        
        // ИСПРАВЛЕНИЕ: ВСЕГДА скрываем кнопку "Повторить ошибки" на страницах вопросов
        reviewInQuizBtn.classList.add('hidden');
        
        // Прокрутка к верху при начале викторины
        setTimeout(() => {
            const mainContainer = document.getElementById('main-container');
            if (mainContainer) {
                mainContainer.scrollTop = 0;
            }
        }, 50);
        
        renderQuestion();
        
    } else if (state.currentView === 'settings') { 
        settingsScreen.classList.remove('hidden');

    } else if (state.currentView === 'results') {
        resultsContainer.classList.remove('hidden');
        resultsFooterFixed.classList.remove('hidden'); 
        renderResults();
    }
    
    updateQuizPadding();
}

    // --- Quiz Logic ---

function renderQuestion() {
    stopSpeaking();
    
    const quiz = state.currentQuiz;
    
    if (quiz.currentIndex >= quiz.questions.length) {
        showResults();
        return;
    }
    
    const currentQ = quiz.questions[quiz.currentIndex];

    const isAnswered = quiz.answers[quiz.currentIndex] !== undefined;

    progressTextFixed.textContent = `Вопрос ${quiz.currentIndex + 1} из ${quiz.questions.length}`;
    correctCountDisplayFixed.textContent = quiz.correctCount;
    incorrectCountDisplayFixed.textContent = quiz.incorrectCount;

    if (quiz.reviewMode) {
         progressTextFixed.textContent += " (Повторение)";
    } else if (quiz.blockIndex === ALL_QUESTIONS_BLOCK) {
         progressTextFixed.textContent = `Вопрос ${quiz.currentIndex + 1} из ${quiz.questions.length} (Все 600)`;
    }

    questionTextFixed.innerHTML = `${currentQ.question}`;
    
    updateQuizPadding(); 
    
    optionsContainer.innerHTML = '';
    
    let optionsToRender = [...currentQ.options];
    if (!isAnswered && state.settings.shuffleOptions) {
        shuffleArray(optionsToRender);
    }
    
    optionsToRender.forEach((optionText, index) => {
        const optionElement = document.createElement('div');
        optionElement.classList.add('option');
        
        const optionPrefix = '';
        
        optionElement.innerHTML = optionPrefix + optionText;
        
        optionElement.dataset.index = index;
        
        if (!isAnswered) {
            optionElement.onclick = () => {
                selectOption(optionElement, currentQ.correct.length > 1);
            };
        }

        if (isAnswered) {
            const answer = quiz.answers[quiz.currentIndex];
            const isMultiChoice = currentQ.correct.length > 1;
            
            const isSelected = answer.selectedOptions.includes(optionText); 

            const isCorrectOption = currentQ.correct.includes(optionText);

            if (isCorrectOption) {
                optionElement.classList.add('correct');
            } else if (isSelected) {
                optionElement.classList.add('incorrect');
            }
        }

        optionsContainer.appendChild(optionElement);
    });
    
    // МГНОВЕННАЯ прокрутка к верху
    setTimeout(() => {
        const mainContainer = document.getElementById('main-container');
        if (mainContainer) {
            mainContainer.scrollTop = 0;
        }
    }, 50);
    
    if (state.ttsMode === 'on') {
        speakQuestion(); 
    }
    
    const isMultiChoice = currentQ.correct.length > 1;
    
    if (isAnswered) {
        actionButton.classList.remove('submit-button');
        actionButton.classList.add('next-button');
        actionButton.textContent = 'Далее';
        actionButton.disabled = false;

    } else {
        actionButton.classList.remove('next-button');
        actionButton.classList.add('submit-button');
        actionButton.textContent = 'Ответить';
        
        actionButton.classList.remove('hidden');
        
actionButton.disabled = false;
    }
    
    backToMenuBtn.classList.remove('hidden');
    
    updateReplayButtonVisibility(); 
}
    
function selectOption(clickedOption, isMultiChoice) {
    console.log('selectOption вызван'); // Должно появиться при клике
    
    if (!isMultiChoice) {
        optionsContainer.querySelectorAll('.option').forEach(opt => {
            opt.classList.remove('selected');
        });
        clickedOption.classList.add('selected');
        actionButton.disabled = false;

        checkAnswer(); // Мгновенная проверка без задержки

    } else {
        clickedOption.classList.toggle('selected');
        const selectedCount = optionsContainer.querySelectorAll('.option.selected').length;
        actionButton.disabled = selectedCount === 0;
    }
}

function checkAnswer() {
    stopSpeaking();
    
    const quiz = state.currentQuiz;
    const currentQ = quiz.questions[quiz.currentIndex];
    
    const selectedOptions = Array.from(optionsContainer.querySelectorAll('.option.selected'))
        .map(opt => opt.textContent.trim());
    
    if (selectedOptions.length === 0) {
        highlightOptions();
        return;
    }

    const correctOptions = currentQ.correct;
    let allCorrectSelected = selectedOptions.every(opt => correctOptions.includes(opt));
    let noExtraSelected = correctOptions.every(opt => selectedOptions.includes(opt));
    
    const isCorrect = allCorrectSelected && noExtraSelected && selectedOptions.length === correctOptions.length;

    quiz.answers[quiz.currentIndex] = {
        questionIndex: quiz.currentIndex,
        selectedOptions: selectedOptions,
        isCorrect: isCorrect
    };

    if (isCorrect) {
        quiz.correctCount++;
        
        // Удаляем из ошибок текущей сессии
        if (quiz.currentSessionMistakes) {
            quiz.currentSessionMistakes = quiz.currentSessionMistakes.filter(q => q.question !== currentQ.question);
        }
        
        // Удаляем из общих массивов ошибок только если НЕ в режиме кругов
        if (!(quiz.blockIndex === MISTAKES_REVIEW_BLOCK || quiz.blockIndex <= -3 || (quiz.blockIndex < -100 && quiz.blockIndex > -1000))) {
            removeMistake(currentQ.question, quiz.blockIndex);
        }
    } else {
        quiz.incorrectCount++;
        
        console.log('❌ НЕПРАВИЛЬНЫЙ ОТВЕТ!');
        console.log('Блок:', quiz.blockIndex);
        console.log('Текущий круг ошибок:', state.currentMistakesRound);
        console.log('Ошибки в круге 1:', state.mistakesRounds[1] ? state.mistakesRounds[1].length : 0);
        
        // Добавляем в ошибки текущей сессии
        if (!quiz.currentSessionMistakes) quiz.currentSessionMistakes = [];
        const alreadyInMistakes = quiz.currentSessionMistakes.some(q => q.question === currentQ.question);
        if (!alreadyInMistakes) {
            quiz.currentSessionMistakes.push(currentQ);
        }
        
        // Добавляем в общие массивы ошибок
        const isMistakesMode = quiz.blockIndex === MISTAKES_REVIEW_BLOCK || 
                              quiz.blockIndex <= -3 || 
                              (quiz.blockIndex < -100 && quiz.blockIndex > -1000);
        
        if (isMistakesMode) {
            const currentRound = state.currentMistakesRound; // Используем текущий круг из состояния
            console.log('🔄 Добавляем ошибку из круга', currentRound, 'в следующий круг');
            addMistakeToNextRound(currentQ, currentRound);
        } else {
            console.log('🔄 Добавляем ошибку в первый круг из обычного блока');
            addMistake(currentQ, quiz.blockIndex);
        }
    }

    optionsContainer.querySelectorAll('.option').forEach(optionElement => {
        const optionText = optionElement.textContent.trim(); 
        const isSelected = selectedOptions.includes(optionText);
        const isCorrectOption = correctOptions.includes(optionText);

        if (isCorrectOption) {
            optionElement.classList.add('correct');
        } else if (isSelected && !isCorrectOption) {
            optionElement.classList.add('incorrect');
        }
        
        optionElement.onclick = null;
    });
    
    correctCountDisplayFixed.textContent = quiz.correctCount;
    incorrectCountDisplayFixed.textContent = quiz.incorrectCount;

    actionButton.classList.remove('submit-button');
    actionButton.classList.add('next-button');
    actionButton.textContent = 'Далее';
    actionButton.classList.remove('hidden'); 

    speakAnswer(isCorrect, correctOptions); 
    
    saveState();
    
    if (isCorrect) {
        if (currentQ.correct.length === 1 || currentQ.correct.length > 1) { 
               handleNextQuestion(); // Мгновенный переход без задержки
        }
    }
}

function highlightOptions() {
    console.log('highlightOptions ВЫЗВАНА');
    
    const options = optionsContainer.querySelectorAll('.option');
    const highlightColor = document.body.classList.contains('dark-theme') 
        ? 'rgba(93, 173, 226, 0.6)' 
        : 'rgba(52, 152, 219, 0.4)';
    
    // Мигаем 3 раза
    let blinkCount = 0;
    const maxBlinks = 3;
    
    const blinkInterval = setInterval(() => {
        options.forEach(option => {
            if (blinkCount % 2 === 0) {
                // Включить внутреннюю подсветку
                option.style.boxShadow = `
                    inset 0 0 0 2px ${highlightColor},
                    inset 0 0 10px ${highlightColor}
                `;
            } else {
                // Выключить подсветку
                option.style.boxShadow = '';
            }
        });
        
        blinkCount++;
        
        if (blinkCount >= maxBlinks * 2) {
            clearInterval(blinkInterval);
            // Финальный сброс
            options.forEach(option => {
                option.style.boxShadow = '';
            });
        }
    }, 300);
}

function handleNextQuestion() {
    state.currentQuiz.currentIndex++;
    saveState(); 
    
    // МГНОВЕННАЯ прокрутка к верху перед рендерингом
    const mainContainer = document.getElementById('main-container');
    if (mainContainer) {
        mainContainer.scrollTop = 0;
    }
    
    renderView();
}
    
function showResults() {
    stopSpeaking();
    
    const quiz = state.currentQuiz;
    const totalQuestions = quiz.questions.length;
    const correct = quiz.correctCount;
    const percentage = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;
    const blockIndex = quiz.blockIndex;

    console.log('showResults вызван для блока:', blockIndex, 'правильно:', correct, 'из:', totalQuestions);

    // Сохраняем прогресс для всех блоков ошибок
    const isMistakesBlock = blockIndex === MISTAKES_REVIEW_BLOCK || 
                           blockIndex <= -3 || 
                           (blockIndex < -100 && blockIndex > -1000);
    
    if (isMistakesBlock) {
        if (!state.userProgress[blockIndex]) {
            state.userProgress[blockIndex] = {
                correct: correct,
                total: totalQuestions
            };
            console.log('✅ Прогресс сохранен для блока ошибок:', blockIndex, state.userProgress[blockIndex]);
        }
    } else if (!quiz.reviewMode) {
        state.userProgress[blockIndex] = {
            correct: correct,
            total: totalQuestions
        };
        console.log('✅ Прогресс сохранен для обычного блока:', blockIndex);
    }
    
    // ИСПРАВЛЕНИЕ: Удаляем незавершенный тест при завершении для ВСЕХ типов блоков
    delete state.unfinishedQuizzes[blockIndex];
    console.log('✅ Удален незавершенный тест для блока:', blockIndex);
    
    initBlocks();
    
    saveState();

    finalCorrect.textContent = correct;
    totalQuestionsDisplay.textContent = totalQuestions;
    finalProgress.style.width = `${percentage}%`;
    
    // ИСПРАВЛЕНИЕ: Правильно определяем есть ли ошибки для повторения в результатах
    const hasMistakesToReview = quiz.currentSessionMistakes && 
                               quiz.currentSessionMistakes.length > 0;
    
    console.log('Результаты: hasMistakesToReview =', hasMistakesToReview);
    console.log('Результаты: currentSessionMistakes =', quiz.currentSessionMistakes);
    
    if (hasMistakesToReview) {
        reviewButton.classList.remove('hidden');
        console.log('✅ Показываем кнопку "Повторить ошибки" в результатах');
    } else {
        reviewButton.classList.add('hidden');
        console.log('❌ Скрываем кнопку "Повторить ошибки" в результатах');
    }
    
    state.currentView = 'results';
    renderView();
    
    updateMistakesCount();
}	

function getRoundFromBlockId(blockId) {
    console.log('getRoundFromBlockId для blockId:', blockId);
    
    if (blockId === MISTAKES_REVIEW_BLOCK) return 1;
    
    if (blockId < -100 && blockId > -1000) {
        // Для блоков ошибок с уникальными ID (-301, -302, etc)
        // -301 → 301 → 3 (круг 3) - НЕПРАВИЛЬНО!
        // Должно быть: -301 → 3 (сотни) - 2 = 1 (круг 1)
        const absoluteId = Math.abs(blockId);
        const round = Math.floor(absoluteId / 100) - 2;
        console.log('Блок', blockId, '→ абсолютный', absoluteId, '→ круг', round);
        return round;
    }
    
    // Для обычных кругов ошибок (-3, -4, -5, etc)
    // -3 → 3 - 2 = 1 (круг 1)
    const round = Math.abs(blockId) - 2;
    console.log('Обычный блок', blockId, '→ круг', round);
    return round;
}

function addMistakeToNextRound(question, currentRound) {
    const questionText = question.question;
    const questionCopy = {...question};
    
    const nextRound = currentRound + 1;
    
    console.log('=== ДОБАВЛЕНИЕ В СЛЕДУЮЩИЙ КРУГ ===');
    console.log('Текущий круг:', currentRound);
    console.log('Следующий круг:', nextRound);
    console.log('Все круги:', Object.keys(state.mistakesRounds));
    
    // Создаем следующий круг если его нет
    if (!state.mistakesRounds[nextRound]) {
        state.mistakesRounds[nextRound] = [];
        console.log('✅ Создан новый круг ошибок:', nextRound);
    }
    
    // Проверяем, нет ли уже этой ошибки в следующем круге
    const existsInNextRound = state.mistakesRounds[nextRound].some(q => q.question === questionText);
    if (!existsInNextRound) {
        state.mistakesRounds[nextRound].push(questionCopy);
        state.maxMistakesRound = Math.max(state.maxMistakesRound, nextRound);
        console.log('✅ Ошибка добавлена в круг', nextRound);
        console.log('✅ Всего ошибок в круге', nextRound, ':', state.mistakesRounds[nextRound].length);
        console.log('✅ Максимальный круг теперь:', state.maxMistakesRound);
        
        // СРАЗУ обновляем кнопку навигации
        updateMistakesCount();
        saveState();
    } else {
        console.log('ℹ️ Ошибка уже есть в круге', nextRound);
    }
    console.log('====================================');
}

    function renderResults() {
        // ... handled in showResults ...
    }
    
function removeMistake(questionText, blockIndex) {
    let list;
    if (blockIndex === ALL_QUESTIONS_BLOCK) {
        list = state.mistakesFromAllQuiz;
    } else if (blockIndex === MISTAKES_REVIEW_BLOCK || blockIndex <= -3) {
        // В режиме кругов ошибка НЕ удаляется при правильном ответе
        return;
    } else {
        if (!state.userMistakesByBlock[blockIndex]) return; 
        list = state.userMistakesByBlock[blockIndex];
    }

    const initialLength = list.length;
    const newList = list.filter(q => q.question !== questionText);
    
    if (blockIndex === ALL_QUESTIONS_BLOCK) {
        state.mistakesFromAllQuiz = newList;
    } else {
        state.userMistakesByBlock[blockIndex] = newList;
    }

    if (newList.length !== initialLength) {
         saveState();
         updateMistakesCount();
    }
}

function addMistake(question, blockIndex) {
    const questionText = question.question;
    const questionCopy = {...question, sourceBlockIndex: blockIndex};

    console.log('=== ДОБАВЛЕНИЕ ОШИБКИ В ПЕРВЫЙ КРУГ ===');
    console.log('Из блока:', blockIndex);
    console.log('Вопрос:', questionText.substring(0, 50) + '...');

    // 1. Добавляем в локальные ошибки блока
    if (!state.userMistakesByBlock[blockIndex]) {
        state.userMistakesByBlock[blockIndex] = [];
    }
    const localMistakes = state.userMistakesByBlock[blockIndex];
    const existsInLocal = localMistakes.some(q => q.question === questionText);
    if (!existsInLocal) {
        localMistakes.push(questionCopy);
        console.log('✅ Ошибка добавлена в локальные ошибки блока');
    }

    // 2. Добавляем в 1-й круг
    if (!state.mistakesRounds[1]) {
        state.mistakesRounds[1] = [];
        console.log('✅ Создан круг 1');
    }
    const existsInRound1 = state.mistakesRounds[1].some(q => q.question === questionText);
    if (!existsInRound1) {
        state.mistakesRounds[1].push(questionCopy);
        console.log('✅ Ошибка добавлена в круг 1');
        console.log('✅ Всего ошибок в круге 1:', state.mistakesRounds[1].length);
    } else {
        console.log('ℹ️ Ошибка уже есть в круге 1');
    }

    saveState();
    updateMistakesCount();
    console.log('====================================');
}
    
function startReviewMode() {
    const quiz = state.currentQuiz;
    
    // Используем только ошибки текущей сессии этого блока
    const questionsToReview = quiz.currentSessionMistakes || [];

    // ПРОВЕРЯЕМ, что ошибки действительно есть
    if (questionsToReview.length > 0) {
        // Создаем новый квиз для повторения ошибок текущей сессии
        const newQuiz = {
            questions: [...questionsToReview], // Копируем массив
            currentIndex: 0,
            answers: [],
            correctCount: 0,
            incorrectCount: 0,
            reviewMode: true,
            blockIndex: quiz.blockIndex,
            currentSessionMistakes: [...questionsToReview] // Сохраняем текущие ошибки
        };
        
        state.currentQuiz = newQuiz;
        state.currentView = 'quiz';
        saveState();
        renderView();
    } else {
        // ЭТО СООБЩЕНИЕ НЕ ДОЛЖНО ПОЯВЛЯТЬСЯ, т.к. кнопка скрыта
        console.log('Нет ошибок для повторения, но кнопка была видимой - это баг');
        // Не показываем модальное окно, просто скрываем кнопку
        reviewInQuizBtn.classList.add('hidden');
    }
}

function showModal(message, type = "alert", onConfirm = () => {}, autoCloseDelay = 0) {
    stopSpeaking();
    
    modalMessage.textContent = message;
    
    modalConfirm.onclick = null;
    modalCancel.onclick = null;

    if (type === "confirm") {
        modalConfirm.textContent = 'Да'; 
        modalConfirm.classList.remove('hidden');
        modalCancel.classList.remove('hidden');
        
        modalConfirm.onclick = () => { onConfirm(); modal.style.display = 'none'; };
        modalCancel.onclick = () => { modal.style.display = 'none'; };
    } else if (type === "notification") {
        // НОВЫЙ ТИП: Уведомление без кнопок с авто-закрытием
        modalConfirm.classList.add('hidden');
        modalCancel.classList.add('hidden');
        
        if (autoCloseDelay > 0) {
            setTimeout(() => {
                modal.style.display = 'none';
            }, autoCloseDelay);
        }
    } else { 
        modalConfirm.textContent = 'ОК'; 
        modalConfirm.classList.remove('hidden');
        modalCancel.classList.add('hidden'); 
        
        modalConfirm.onclick = () => modal.style.display = 'none';
    }
    modal.style.display = 'flex';
}
    
function resetApplication() {
    showModal('Вы уверены, что хотите сбросить весь прогресс? Будут сброшены результаты, незавершенные тесты и все сохраненные ошибки.', 'confirm', () => {
        
        const currentSettings = state.settings; 
        const currentTtsRate = state.ttsRate;
        const currentTtsMode = state.ttsMode;
        
        localStorage.removeItem('quizState');
        
        state = {
            currentView: 'start', 
            previousView: 'start',
            currentMistakesRound: 1,
            maxMistakesRound: 1,
            currentQuiz: {
                questions: [], currentIndex: 0, answers: [], correctCount: 0, incorrectCount: 0, reviewMode: false, blockIndex: ALL_QUESTIONS_BLOCK
            },
            userProgress: {}, 
            unfinishedQuizzes: {}, 
            userMistakesByBlock: {},
            mistakesFromAllQuiz: [],
            mistakesRounds: {1: []},
            ttsMode: currentTtsMode,
            ttsRate: currentTtsRate,
            settings: currentSettings,
            shuffledQuestions: null
        };
        
        settingsTtsRateSlider.value = state.ttsRate;
        loadTheme(state.settings.theme); 
        saveState(); 
        initBlocks(); 
        updateMistakesCount();
        renderView(); 
        
        showModal('Прогресс сброшен!', 'alert');
    });
}

    function toggleTheme() {
        const isDark = !document.body.classList.contains('dark-theme');
        loadTheme(isDark ? 'dark' : 'light');
        saveState();
    }


    // --- Event Listeners ---
    
reviewInQuizBtn.addEventListener('click', () => {
    startReviewMode();
});

actionButton.addEventListener('click', () => {
    const isAnswered = state.currentQuiz.answers[state.currentQuiz.currentIndex] !== undefined;
    
    if (!isAnswered && actionButton.textContent === 'Ответить') {
        // ПРЯМОЙ ВЫЗОВ checkAnswer() при нажатии на кнопку
        checkAnswer();
    } else if (isAnswered && actionButton.textContent === 'Далее') {
        handleNextQuestion();
    }
});
    
restartButton.addEventListener('click', () => {
    const quiz = state.currentQuiz;
    
    if (quiz.blockIndex !== MISTAKES_REVIEW_BLOCK && quiz.blockIndex > -3) {
         delete state.unfinishedQuizzes[quiz.blockIndex];
    }
    
    if (quiz.reviewMode) { 
        if (quiz.blockIndex === MISTAKES_REVIEW_BLOCK || quiz.blockIndex <= -3) {
            const currentMistakes = quiz.questions;
            if (currentMistakes.length > 0) {
                startQuiz(currentMistakes.length, quiz.blockIndex, true, currentMistakes);
            } else {
                showModal('В этом блоке больше нет ошибок!', 'alert');
                resetStateToMenu();
            }
        } else {
            resetStateToMenu();
        }
    }
    else if (quiz.blockIndex !== ALL_QUESTIONS_BLOCK && quiz.blockIndex !== MISTAKES_REVIEW_BLOCK && quiz.blockIndex > -3) {
        startQuiz(effectiveQuestionsPerBlock, quiz.blockIndex);
    } else if (quiz.blockIndex === ALL_QUESTIONS_BLOCK) {
        startQuiz(effectiveTotalExpectedQuestions, ALL_QUESTIONS_BLOCK);
    } else if (quiz.blockIndex === MISTAKES_REVIEW_BLOCK || quiz.blockIndex <= -3) {
        const currentMistakes = quiz.questions;
        if (currentMistakes.length > 0) {
            startQuiz(currentMistakes.length, quiz.blockIndex, true, currentMistakes);
        } else {
            showModal('В этом блоке больше нет ошибок!', 'alert');
            resetStateToMenu();
        }
    }
});
    
reviewButton.addEventListener('click', () => {
    const quiz = state.currentQuiz;
    
    // Всегда используем ошибки текущей сессии
    const questionsToReview = quiz.currentSessionMistakes || [];

    // ПРОВЕРЯЕМ, что ошибки действительно есть
    if (questionsToReview.length > 0) {
        // Создаем новый квиз для повторения ошибок текущей сессии
        const newQuiz = {
            questions: [...questionsToReview],
            currentIndex: 0,
            answers: [],
            correctCount: 0,
            incorrectCount: 0,
            reviewMode: true,
            blockIndex: quiz.blockIndex,
            currentSessionMistakes: [...questionsToReview]
        };
        
        state.currentQuiz = newQuiz;
        state.currentView = 'quiz';
        saveState();
        renderView();
    } else {
        // Скрываем кнопку вместо показа сообщения
        reviewButton.classList.add('hidden');
        console.log('Нет ошибок для повторения в результатах');
    }
});

menuButton.addEventListener('click', () => { 
    console.log('menuButton: isMistakesMode =', state.isMistakesMode, 'currentMistakesRound =', state.currentMistakesRound);
    
    state.currentView = 'start';
    saveState();
    // Принудительно обновляем блоки
    initBlocks();
    renderView();
});

backToMenuBtn.addEventListener('click', () => { 
    console.log('backToMenuBtn: isMistakesMode =', state.isMistakesMode, 'currentMistakesRound =', state.currentMistakesRound);
    
    state.currentView = 'start';
    saveState();
    // Принудительно обновляем блоки
    initBlocks();
    renderView();
});
    
allQuestionsBtn.addEventListener('click', () => startQuiz(effectiveTotalExpectedQuestions, ALL_QUESTIONS_BLOCK));

    resetBtn.addEventListener('click', resetApplication);
    
    settingsToggle.addEventListener('click', () => {
        if (state.currentView === 'settings') {
            returnFromSettings(); 
        } else {
            openSettings();
        }
    });
    
    themeModeBtn.addEventListener('click', toggleTheme);
    
    ttsToggleButton.addEventListener('click', toggleTtsMode);
    
    settingsTtsRateSlider.addEventListener('input', () => {
        state.ttsRate = parseFloat(settingsTtsRateSlider.value);
        updateTtsButtonIcon(); 
        saveState();
    });
    
    readAnswersToggle.addEventListener('change', () => {
        state.settings.readAnswers = readAnswersToggle.checked;
        saveState();
    });
    
    readOptionsWithQuestionToggle.addEventListener('change', () => {
        state.settings.readOptionsWithQuestion = readOptionsWithQuestionToggle.checked;
        saveState();
        if (state.currentView === 'quiz') {
            renderQuestion();
        }
    });
    
shuffleQuestionsToggle.addEventListener('change', () => {
    const wasShuffled = state.settings.shuffleQuestions;
    state.settings.shuffleQuestions = shuffleQuestionsToggle.checked;
    
    // Сбрасываем кэш перемешанных вопросов при изменении настройки
    state.shuffledQuestions = null;
    
    saveState();
    
    if (state.settings.shuffleQuestions && !wasShuffled) {
        showModal('Вопросы перемешаны между блоками в случайном порядке.', 'alert');
    } else if (!state.settings.shuffleQuestions && wasShuffled) {
        showModal('Вопросы возвращены в исходный порядок.', 'alert');
    }
});

    shuffleOptionsToggle.addEventListener('change', () => {
        state.settings.shuffleOptions = shuffleOptionsToggle.checked;
        saveState();
    });

    ttsReplayButton.addEventListener('click', () => {
        if (isSpeaking) {
            stopSpeaking();
        } else {
            speakQuestion(); 
        }
    });

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

    document.addEventListener('DOMContentLoaded', loadState);