const screens = [...document.querySelectorAll('[data-screen]')];

const LETTERS = [
  { char: 'അ', sound: 'a', example: 'അമ്മ (amma)', audio: 'audio/letters/a.mp3' },
  { char: 'ആ', sound: 'aa', example: 'ആട് (aadu)', audio: 'audio/letters/aa.mp3' },
  { char: 'ഇ', sound: 'i', example: 'ഇല (ila)', audio: 'audio/letters/i.mp3' },
  { char: 'ഈ', sound: 'ee', example: 'ഈച്ച (eecha)', audio: 'audio/letters/ee.mp3' },
  { char: 'ഉ', sound: 'u', example: 'ഉപ്പ് (uppu)', audio: 'audio/letters/u.mp3' },
  { char: 'ക', sound: 'ka', example: 'കടൽ (kadal)', audio: 'audio/letters/ka.mp3' },
  { char: 'മ', sound: 'ma', example: 'മരം (maram)', audio: 'audio/letters/ma.mp3' },
  { char: 'പ', sound: 'pa', example: 'പാൽ (paal)', audio: 'audio/letters/pa.mp3' },
  { char: 'ത', sound: 'tha', example: 'തല (thala)', audio: 'audio/letters/tha.mp3' },
  { char: 'ന', sound: 'na', example: 'നദി (nadi)', audio: 'audio/letters/na.mp3' },
];

const UNIT = {
  id: 'unit-1',
  title: 'Unit 1: Core Malayalam Letters',
  lessons: [
    { id: 'l1', title: 'Lesson 1', letters: ['അ', 'ആ', 'ഇ'] },
    { id: 'l2', title: 'Lesson 2', letters: ['ഈ', 'ഉ', 'ക'] },
    { id: 'l3', title: 'Lesson 3', letters: ['മ', 'പ', 'ത'] },
    { id: 'l4', title: 'Lesson 4', letters: ['ന', 'അ', 'ക'] },
    { id: 'l5', title: 'Lesson 5', letters: ['ആ', 'മ', 'പ'] },
    { id: 'l6', title: 'Lesson 6', letters: ['ഇ', 'ഈ', 'ഉ'] },
    { id: 'l7', title: 'Lesson 7', letters: ['ത', 'ന', 'അ'] },
  ],
};

const WORD_QUESTIONS = [
  {
    word: ['അ', 'മ', 'മ'],
    audioText: 'അമ്മ',
    prompt: 'Build the word for the audio clip.',
    audio: 'audio/words/amma.mp3',
  },
  {
    word: ['ക', 'പ'],
    audioText: 'കപ',
    prompt: 'Build the word for the audio clip.',
    audio: 'audio/words/kapa.mp3',
  },
  {
    word: ['പ', 'ന'],
    audioText: 'പന',
    prompt: 'Build the word for the audio clip.',
    audio: 'audio/words/pana.mp3',
  },
];

const state = {
  goal: 5,
  activeUnit: UNIT,
  currentLessonIdx: 0,
  lessonCardIdx: 0,
  lessonPracticeSet: [],
  lessonPracticeIdx: 0,
  lessonPracticeCorrect: 0,
  lessonAttemptSignatures: {},
  quizQuestions: [],
  quizIdx: 0,
  quizCorrect: 0,
  completedLessons: new Set(),
  quizPassed: false,
  selectedChoiceCorrect: false,
};

function showScreen(name) {
  screens.forEach((screen) => {
    screen.classList.toggle('active', screen.id === `screen-${name}`);
  });
}

function letterByChar(char) {
  return LETTERS.find((l) => l.char === char);
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

let sharedAudio;

async function playAudioFile(src) {
  if (!src) return false;
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.preload = 'auto';
  }
  sharedAudio.pause();
  sharedAudio.currentTime = 0;
  sharedAudio.src = src;
  try {
    await sharedAudio.play();
    return true;
  } catch (err) {
    return false;
  }
}

function speak(text, lang = 'ml-IN') {
  if ('speechSynthesis' in window) {
    const msg = new SpeechSynthesisUtterance(text);
    msg.rate = 0.8;
    msg.lang = lang;

    const voices = speechSynthesis.getVoices();
    const malayalamVoice = voices.find((voice) => voice.lang?.toLowerCase().startsWith('ml'));
    if (malayalamVoice) {
      msg.voice = malayalamVoice;
    }

    speechSynthesis.cancel();
    speechSynthesis.speak(msg);
    return;
  }
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = 'sine';
  osc.frequency.value = 330;
  gain.gain.value = 0.05;
  osc.connect(gain);
  gain.connect(context.destination);
  osc.start();
  osc.stop(context.currentTime + 0.35);
}

async function playPromptAudio({ audioSrc, fallbackText, fallbackLang = 'ml-IN' }) {
  const played = await playAudioFile(audioSrc);
  if (!played && fallbackText) {
    speak(fallbackText, fallbackLang);
  }
}

function unitPercent() {
  const totalSteps = state.activeUnit.lessons.length + 1;
  const done = state.completedLessons.size + (state.quizPassed ? 1 : 0);
  return Math.round((done / totalSteps) * 100);
}

function isLessonUnlocked(idx) {
  if (idx === 0) return true;
  return state.completedLessons.has(state.activeUnit.lessons[idx - 1].id);
}

function isQuizUnlocked() {
  return state.activeUnit.lessons.every((lesson) => state.completedLessons.has(lesson.id));
}

function updateHome() {
  document.getElementById('daily-goal-label').textContent = `Goal: ${state.goal} min/day`;
  const unitsList = document.getElementById('units-list');
  unitsList.innerHTML = '';
  const card = document.createElement('article');
  card.className = 'card';
  const pct = unitPercent();
  card.innerHTML = `
    <h3>${state.activeUnit.title}</h3>
    <p>Progress: ${pct}%</p>
    <progress max="100" value="${pct}">${pct}%</progress>
    <button type="button" class="primary" id="open-unit">Open Unit</button>
  `;
  unitsList.appendChild(card);
  document.getElementById('open-unit').addEventListener('click', () => {
    updateUnitScreen();
    showScreen('unit');
  });
}

function updateUnitScreen() {
  document.getElementById('unit-title').textContent = state.activeUnit.title;
  document.getElementById('unit-progress-label').textContent = `${unitPercent()}% complete`;
  const steps = document.getElementById('unit-steps');
  steps.innerHTML = '';

  state.activeUnit.lessons.forEach((lesson, idx) => {
    const unlocked = isLessonUnlocked(idx);
    const completed = state.completedLessons.has(lesson.id);
    const row = document.createElement('article');
    row.className = 'card lesson-row';
    row.innerHTML = `
      <div>
        <h3>${lesson.title}</h3>
        <p>Letters: ${lesson.letters.join(' • ')}</p>
      </div>
      <div class="right-stack">
        <p>${completed ? '✅ Done' : unlocked ? '🔓 Unlocked' : '🔒 Locked'}</p>
        <button type="button" class="${unlocked ? 'primary' : 'locked'}" ${unlocked ? '' : 'disabled'}>
          ${completed ? 'Review' : 'Start'}
        </button>
      </div>
    `;
    if (unlocked) {
      row.querySelector('button').addEventListener('click', () => startLesson(idx));
    }
    steps.appendChild(row);
  });

  const quizRow = document.createElement('article');
  const unlockedQuiz = isQuizUnlocked();
  quizRow.className = 'card lesson-row';
  quizRow.innerHTML = `
    <div>
      <h3>Unit Quiz</h3>
      <p>Need 85% or higher to pass.</p>
    </div>
    <div class="right-stack">
      <p>${state.quizPassed ? '✅ Passed' : unlockedQuiz ? '🔓 Unlocked' : '🔒 Locked'}</p>
      <button type="button" class="${unlockedQuiz ? 'primary' : 'locked'}" ${unlockedQuiz ? '' : 'disabled'}>
        ${state.quizPassed ? 'Retake' : 'Start Quiz'}
      </button>
    </div>
  `;
  if (unlockedQuiz) {
    quizRow.querySelector('button').addEventListener('click', startQuiz);
  }
  steps.appendChild(quizRow);
}

function startLesson(idx) {
  state.currentLessonIdx = idx;
  state.lessonCardIdx = 0;
  document.getElementById('lesson-title').textContent = `${state.activeUnit.lessons[idx].title} Flashcards`;
  document.getElementById('lesson-header').textContent = `${state.activeUnit.lessons[idx].title} (${idx + 1}/${state.activeUnit.lessons.length})`;
  renderLessonCard();
  showScreen('lesson');
}

function renderLessonCard() {
  const lesson = state.activeUnit.lessons[state.currentLessonIdx];
  const char = lesson.letters[state.lessonCardIdx];
  const item = letterByChar(char);
  document.getElementById('lesson-progress').textContent = `Card ${state.lessonCardIdx + 1}/${lesson.letters.length}`;
  document.getElementById('letter-display').textContent = item.char;
  document.getElementById('sound-display').textContent = `Sound: /${item.sound}/`;
  document.getElementById('example-word').textContent = `Example: ${item.example}`;
}

function randomDistractors(correctChar, count = 3) {
  const others = LETTERS.map((l) => l.char).filter((c) => c !== correctChar);
  return shuffle(others).slice(0, count);
}

function createPracticeSet() {
  const lesson = state.activeUnit.lessons[state.currentLessonIdx];
  const signatures = state.lessonAttemptSignatures[lesson.id] || new Set();

  let attempts = 0;
  while (attempts < 40) {
    attempts += 1;
    const q1Char = shuffle(lesson.letters)[0];
    const q2Char = shuffle(lesson.letters.filter((c) => c !== q1Char))[0] || shuffle(lesson.letters)[0];
    const q1 = {
      type: 'letterToSound',
      prompt: `What sound does this letter make: ${q1Char}?`,
      audioSrc: letterByChar(q1Char).audio,
      playText: q1Char,
      correct: letterByChar(q1Char).sound,
      options: shuffle([letterByChar(q1Char).sound, ...shuffle(LETTERS.map((l) => l.sound).filter((s) => s !== letterByChar(q1Char).sound)).slice(0, 3)]),
    };
    const q2 = {
      type: 'soundToLetter',
      prompt: 'Which letter matches this sound?',
      audioSrc: letterByChar(q2Char).audio,
      playText: q2Char,
      correct: q2Char,
      options: shuffle([q2Char, ...randomDistractors(q2Char)]),
    };

    const signature = `${q1.correct}-${q1.options.join('')}-${q2.correct}-${q2.options.join('')}`;
    if (!signatures.has(signature)) {
      signatures.add(signature);
      state.lessonAttemptSignatures[lesson.id] = signatures;
      return [q1, q2];
    }
  }
  return [];
}

function startLessonPractice() {
  state.lessonPracticeSet = createPracticeSet();
  state.lessonPracticeIdx = 0;
  state.lessonPracticeCorrect = 0;
  renderPracticeQuestion();
  showScreen('practice');
}

function renderPracticeQuestion() {
  const q = state.lessonPracticeSet[state.lessonPracticeIdx];
  document.getElementById('practice-progress').textContent = `${state.lessonPracticeIdx + 1}/2`;
  document.getElementById('practice-prompt').textContent = q.prompt;
  document.getElementById('practice-feedback').textContent = 'Pick one answer.';
  document.getElementById('practice-continue').disabled = true;
  const grid = document.getElementById('practice-answer-grid');
  grid.innerHTML = '';

  q.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = opt;
    btn.addEventListener('click', () => {
      [...grid.querySelectorAll('button')].forEach((b) => b.classList.remove('correct', 'wrong'));
      if (opt === q.correct) {
        state.lessonPracticeCorrect += 1;
        btn.classList.add('correct');
        document.getElementById('practice-feedback').textContent = '✅ Correct';
      } else {
        btn.classList.add('wrong');
        document.getElementById('practice-feedback').textContent = `❌ Incorrect. Right answer: ${q.correct}`;
      }
      document.getElementById('practice-continue').disabled = false;
      [...grid.querySelectorAll('button')].forEach((b) => {
        b.disabled = true;
      });
    }, { once: true });
    grid.appendChild(btn);
  });
}

function buildQuizQuestions() {
  const questions = [];

  const soundToLetter = shuffle(LETTERS).slice(0, 3).map((l) => ({
    type: 'soundToLetter',
    prompt: 'Listen and pick the correct letter.',
    audioText: l.char,
    audioSrc: l.audio,
    correct: l.char,
    options: shuffle([l.char, ...randomDistractors(l.char)]),
  }));

  const letterToSound = shuffle(LETTERS).slice(0, 3).map((l) => ({
    type: 'letterToSound',
    prompt: `Which sound matches this letter: ${l.char}?`,
    audioText: l.char,
    audioSrc: l.audio,
    correct: l.sound,
    options: shuffle([l.sound, ...shuffle(LETTERS.map((x) => x.sound).filter((s) => s !== l.sound)).slice(0, 3)]),
  }));

  const selectedWord = shuffle(WORD_QUESTIONS).slice(0, 2).map((w) => ({
    type: 'wordBuild',
    prompt: w.prompt,
    audioText: w.audioText,
    audioSrc: w.audio,
    correct: w.word,
    letterBank: shuffle([...w.word, ...shuffle(LETTERS.map((l) => l.char).filter((c) => !w.word.includes(c))).slice(0, 3)]),
  }));

  questions.push(...soundToLetter, ...letterToSound, ...selectedWord);
  return shuffle(questions);
}

function startQuiz() {
  state.quizQuestions = buildQuizQuestions();
  state.quizIdx = 0;
  state.quizCorrect = 0;
  renderQuizQuestion();
  showScreen('quiz');
}

function renderQuizQuestion() {
  state.selectedChoiceCorrect = false;
  const q = state.quizQuestions[state.quizIdx];
  document.getElementById('quiz-progress').textContent = `Q${state.quizIdx + 1}/${state.quizQuestions.length}`;
  document.getElementById('quiz-type-label').textContent =
    q.type === 'wordBuild' ? 'Type: Word builder (drag and drop)' : 'Type: Multiple choice';
  document.getElementById('quiz-prompt').textContent = q.prompt;
  document.getElementById('quiz-feedback').textContent = 'Answer to continue.';
  document.getElementById('quiz-continue').disabled = true;

  const choiceArea = document.getElementById('quiz-choice-area');
  const wordBuilder = document.getElementById('quiz-word-builder');
  const playBtn = document.getElementById('quiz-play-audio');

  playBtn.onclick = () => {
    playPromptAudio({ audioSrc: q.audioSrc, fallbackText: q.audioText });
  };

  choiceArea.innerHTML = '';
  wordBuilder.classList.add('hidden');

  if (q.type === 'wordBuild') {
    renderWordBuild(q);
    return;
  }

  q.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = opt;
    btn.addEventListener('click', () => {
      [...choiceArea.querySelectorAll('button')].forEach((b) => b.classList.remove('correct', 'wrong'));
      const isCorrect = opt === q.correct;
      state.selectedChoiceCorrect = isCorrect;
      btn.classList.add(isCorrect ? 'correct' : 'wrong');
      document.getElementById('quiz-feedback').textContent = isCorrect ? '✅ Correct' : `❌ Right answer: ${q.correct}`;
      document.getElementById('quiz-continue').disabled = false;
      [...choiceArea.querySelectorAll('button')].forEach((b) => {
        b.disabled = true;
      });
    }, { once: true });
    choiceArea.appendChild(btn);
  });
}

function renderWordBuild(question) {
  const wordBuilder = document.getElementById('quiz-word-builder');
  const dropZone = document.getElementById('word-drop-zone');
  const bank = document.getElementById('word-letter-bank');
  const checkBtn = document.getElementById('check-word');
  const continueBtn = document.getElementById('quiz-continue');

  wordBuilder.classList.remove('hidden');
  dropZone.innerHTML = '';
  bank.innerHTML = '';
  continueBtn.disabled = true;
  state.selectedChoiceCorrect = false;

  question.correct.forEach((_, idx) => {
    const slot = document.createElement('div');
    slot.className = 'drop-slot';
    slot.dataset.slot = String(idx);
    slot.addEventListener('dragover', (e) => e.preventDefault());
    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      const letter = e.dataTransfer.getData('text/plain');
      if (!letter || slot.textContent) return;
      slot.textContent = letter;
      const source = document.querySelector(`.bank-letter[data-id="${e.dataTransfer.getData('id')}"]`);
      if (source) source.remove();
    });
    dropZone.appendChild(slot);
  });

  question.letterBank.forEach((char, idx) => {
    const chip = document.createElement('div');
    chip.className = 'bank-letter';
    chip.draggable = true;
    chip.dataset.id = `l-${idx}-${char}`;
    chip.textContent = char;
    chip.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', char);
      e.dataTransfer.setData('id', chip.dataset.id);
    });
    bank.appendChild(chip);
  });

  checkBtn.onclick = () => {
    const built = [...dropZone.querySelectorAll('.drop-slot')].map((s) => s.textContent || '');
    if (built.some((c) => !c)) {
      document.getElementById('quiz-feedback').textContent = 'Fill all slots first.';
      return;
    }
    const isCorrect = built.join('') === question.correct.join('');
    state.selectedChoiceCorrect = isCorrect;
    document.getElementById('quiz-feedback').textContent =
      isCorrect ? '✅ Correct word' : `❌ Expected: ${question.correct.join('')}`;
    continueBtn.disabled = false;
  };
}

function finishQuiz() {
  const percent = Math.round((state.quizCorrect / state.quizQuestions.length) * 100);
  const passed = percent >= 85;
  state.quizPassed = passed;
  document.getElementById('result-title').textContent = passed ? 'Quiz Passed 🎉' : 'Quiz Not Passed Yet';
  document.getElementById('result-score').textContent = `Score: ${percent}% (${state.quizCorrect}/${state.quizQuestions.length})`;
  document.getElementById('result-detail').textContent = passed
    ? 'Great job! Unit complete.'
    : 'You need 85%+. Retake to continue.';
  document.getElementById('result-primary').textContent = passed ? 'Back to Unit' : 'Retake Quiz';
  document.getElementById('result-primary').onclick = () => {
    if (!passed) {
      startQuiz();
      return;
    }
    updateUnitScreen();
    showScreen('unit');
  };
  showScreen('result');
}

function bindEvents() {
  document.querySelectorAll('[data-goal-min]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-goal-min]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.goal = Number(btn.dataset.goalMin);
    });
  });

  document.querySelectorAll('[data-next]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.next;
      if (next === 'home') updateHome();
      if (next === 'unit') updateUnitScreen();
      showScreen(next);
    });
  });

  document.getElementById('play-letter-audio').addEventListener('click', () => {
    const lesson = state.activeUnit.lessons[state.currentLessonIdx];
    const char = lesson.letters[state.lessonCardIdx];
    const item = letterByChar(char);
    playPromptAudio({ audioSrc: item.audio, fallbackText: item.char });
  });

  document.getElementById('previous-card').addEventListener('click', () => {
    state.lessonCardIdx = Math.max(0, state.lessonCardIdx - 1);
    renderLessonCard();
  });

  document.getElementById('next-card').addEventListener('click', () => {
    const lesson = state.activeUnit.lessons[state.currentLessonIdx];
    if (state.lessonCardIdx < lesson.letters.length - 1) {
      state.lessonCardIdx += 1;
      renderLessonCard();
      return;
    }
    startLessonPractice();
  });

  document.getElementById('practice-play-audio').addEventListener('click', () => {
    const q = state.lessonPracticeSet[state.lessonPracticeIdx];
    if (q?.playText) {
      playPromptAudio({ audioSrc: q.audioSrc, fallbackText: q.playText });
    }
  });

  document.getElementById('practice-continue').addEventListener('click', () => {
    if (state.lessonPracticeIdx < state.lessonPracticeSet.length - 1) {
      state.lessonPracticeIdx += 1;
      renderPracticeQuestion();
      return;
    }

    const passed = state.lessonPracticeCorrect === 2;
    if (passed) {
      const lessonId = state.activeUnit.lessons[state.currentLessonIdx].id;
      state.completedLessons.add(lessonId);
      document.getElementById('result-title').textContent = 'Lesson Passed ✅';
      document.getElementById('result-score').textContent = 'You got 2/2 practice questions right.';
      document.getElementById('result-detail').textContent = 'Lesson unlocked next step.';
      document.getElementById('result-primary').textContent = 'Back to Unit';
      document.getElementById('result-primary').onclick = () => {
        updateUnitScreen();
        showScreen('unit');
      };
      showScreen('result');
      return;
    }

    document.getElementById('result-title').textContent = 'Try Lesson Again';
    document.getElementById('result-score').textContent = 'You must get both practice questions right.';
    document.getElementById('result-detail').textContent = 'You will review cards again and get a new practice set.';
    document.getElementById('result-primary').textContent = 'Retry Lesson';
    document.getElementById('result-primary').onclick = () => {
      state.lessonCardIdx = 0;
      renderLessonCard();
      showScreen('lesson');
    };
    showScreen('result');
  });

  document.getElementById('quiz-continue').addEventListener('click', () => {
    if (state.selectedChoiceCorrect) {
      state.quizCorrect += 1;
    }

    if (state.quizIdx < state.quizQuestions.length - 1) {
      state.quizIdx += 1;
      renderQuizQuestion();
      return;
    }
    finishQuiz();
  });
}

bindEvents();
updateHome();
