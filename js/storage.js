    function saveState() {
        localStorage.setItem('quizState', JSON.stringify(state));
    }

    function loadState() {
        const savedState = localStorage.getItem('quizState');
        if (savedState) {
            const loadedState = JSON.parse(savedState);
            
            // Гарантируем наличие всех необходимых свойств
            loadedState.mistakesRounds = loadedState.mistakesRounds || {1: []};
            loadedState.userMistakesByBlock = loadedState.userMistakesByBlock || {};
            loadedState.mistakesFromAllQuiz = loadedState.mistakesFromAllQuiz || [];
            loadedState.userProgress = loadedState.userProgress || {};
            loadedState.unfinishedQuizzes = loadedState.unfinishedQuizzes || {};
            loadedState.shuffledQuestions = loadedState.shuffledQuestions || null; // ← ДОБАВЬТЕ ЭТУ СТРОКУ
            loadedState.settings = { ...defaultSettings, ...(loadedState.settings || {}) };
            
            state = { ...state, ...loadedState }; 

            if (!state.shuffledQuestions) {state.shuffledQuestions = null;}
            if (!state.userMistakesByBlock) { state.userMistakesByBlock = {}; }
            if (!state.mistakesFromAllQuiz) { state.mistakesFromAllQuiz = []; }
            if (!state.unfinishedQuizzes) { state.unfinishedQuizzes = {}; }
            if (!state.mistakesRounds) { state.mistakesRounds = {1: []}; }
            if (!state.maxMistakesRound) { state.maxMistakesRound = 1; }
            if (!state.currentMistakesRound) { state.currentMistakesRound = 1; }
            
            if (!loadedState.ttsMode || loadedState.ttsMode.startsWith('x')) { 
                state.ttsMode = 'off';
            } 
            if (typeof loadedState.ttsRate !== 'number' || loadedState.ttsRate < 0.5 || loadedState.ttsRate > 2.0) { state.ttsRate = 1.0; } 
            
            if (state.currentView === 'quiz' && state.currentQuiz.questions.length === 0) {
                 resetStateToMenu();
            } else if (state.currentView === 'quiz') {
                 const key = state.currentQuiz.blockIndex;
                 if (state.unfinishedQuizzes[key] && state.unfinishedQuizzes[key].questions.length > 0) {
                     state.currentQuiz = state.unfinishedQuizzes[key];
                 }
            }
        }
        
        loadTheme(state.settings.theme);

        settingsTtsRateSlider.value = state.ttsRate;

        initBlocks();
        updateMistakesCount(); 
        renderView();
        window.addEventListener('resize', updateQuizPadding); 
        updateQuizPadding(); 
        updateTtsButtonIcon(); 
    }