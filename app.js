const screens = [...document.querySelectorAll('[data-screen]')];
const letters = [
  { char: 'അ', pronunciation: 'a', example: 'അപ്പം (appam)' },
  { char: 'ക', pronunciation: 'ka', example: 'കടൽ (kadal)' },
  { char: 'മ', pronunciation: 'ma', example: 'മരം (maram)' },
];

const quiz = [
  { prompt: 'a', correct: 'അ', options: ['അ', 'ക', 'മ', 'ത'] },
  { prompt: 'ka', correct: 'ക', options: ['ത', 'മ', 'ക', 'അ'] },
  { prompt: 'ma', correct: 'മ', options: ['അ', 'ത', 'മ', 'ക'] },
];

let selectedGoal = 5;
let lessonIndex = 0;
let quizIndex = 0;
let score = 0;
let selectedAnswer = null;

function showScreen(name) {
  screens.forEach((screen) => {
    screen.classList.toggle('active', screen.id === `screen-${name}`);
  });
}

function updateHomeGoal() {
  const goal = document.getElementById('today-goal');
  const progress = document.getElementById('goal-progress');
  const label = document.getElementById('goal-progress-label');
  const done = Math.min(2, selectedGoal);

  goal.textContent = `Today's Goal: ${selectedGoal} min`;
  progress.max = selectedGoal;
  progress.value = done;
  label.textContent = `${done}/${selectedGoal} min`;
}

function updateLesson() {
  const item = letters[lessonIndex];
  document.getElementById('lesson-progress').textContent = `${lessonIndex + 1} of ${letters.length} cards`;
  document.getElementById('letter-display').textContent = item.char;
  document.getElementById('pronunciation').textContent = `Pronunciation: "${item.pronunciation}"`;
  document.getElementById('example').textContent = `Example: ${item.example}`;
}

function renderQuiz() {
  const item = quiz[quizIndex];
  document.getElementById('quiz-progress').textContent = `Q${quizIndex + 1} / ${quiz.length}`;
  document.getElementById('play-sound').textContent = `🔊 Play Sound (${item.prompt})`;
  document.getElementById('quiz-feedback').textContent = 'Select an answer to continue.';
  document.getElementById('quiz-continue').disabled = true;
  selectedAnswer = null;

  const grid = document.getElementById('answer-grid');
  grid.innerHTML = '';

  item.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = opt;
    btn.addEventListener('click', () => {
      selectedAnswer = opt;
      [...grid.querySelectorAll('button')].forEach((b) => b.classList.remove('correct', 'wrong'));
      if (opt === item.correct) {
        btn.classList.add('correct');
        document.getElementById('quiz-feedback').textContent = '✅ Correct!';
      } else {
        btn.classList.add('wrong');
        document.getElementById('quiz-feedback').textContent = '❌ Not quite. Try continue for next question.';
      }
      document.getElementById('quiz-continue').disabled = false;
    });
    grid.appendChild(btn);
  });
}

function resetFlow() {
  lessonIndex = 0;
  quizIndex = 0;
  score = 0;
  selectedAnswer = null;
  updateLesson();
  renderQuiz();
}

document.querySelectorAll('[data-goal-min]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-goal-min]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    selectedGoal = Number(btn.dataset.goalMin);
  });
});

document.querySelectorAll('[data-next]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const next = btn.dataset.next;
    if (next === 'lesson') {
      resetFlow();
    }
    if (next === 'home') {
      updateHomeGoal();
    }
    showScreen(next);
  });
});

document.getElementById('previous-card').addEventListener('click', () => {
  lessonIndex = Math.max(0, lessonIndex - 1);
  updateLesson();
});

document.getElementById('next-card').addEventListener('click', () => {
  if (lessonIndex < letters.length - 1) {
    lessonIndex += 1;
    updateLesson();
    return;
  }
  quizIndex = 0;
  score = 0;
  renderQuiz();
  showScreen('quiz');
});

document.getElementById('quiz-continue').addEventListener('click', () => {
  if (selectedAnswer === quiz[quizIndex].correct) {
    score += 1;
  }

  if (quizIndex < quiz.length - 1) {
    quizIndex += 1;
    renderQuiz();
    return;
  }

  document.getElementById('result-score').textContent = `Score: ${score}/${quiz.length}`;
  showScreen('result');
});

document.getElementById('review').addEventListener('click', () => {
  lessonIndex = 0;
  updateLesson();
  showScreen('lesson');
});

updateHomeGoal();
updateLesson();
renderQuiz();
