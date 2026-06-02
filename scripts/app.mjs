import { clearElement, createElement, renderEmpty, setVisible } from './dom.mjs';
import { clearAppData, loadState, saveState } from './storage.mjs';
import {
  createExerciseStates,
  createIncompatibility,
  generateWorkout,
  getSortedExercises,
  hasName,
  isWorkoutComplete,
  normalizeMuscleKey,
  normalizeMuscleName,
  pruneExerciseStates,
  removeMainMuscleFromWorkout,
  renameMuscleInWorkout,
  sanitizeIncompatibilities,
  stripAdditionalMuscle
} from './workout.mjs';

const config = globalThis.WorkoutConfig;
const state = loadState();
let showMore = false;
let updateBannerVisible = false;

const refs = {};

function byId(id) {
  return document.getElementById(id);
}

function collectRefs() {
  [
    'setupScreen',
    'workoutScreen',
    'mainMuscleInput',
    'additionalMuscleInput',
    'mainMusclesList',
    'additionalMusclesList',
    'incompatibilityFirst',
    'incompatibilitySecond',
    'addIncompatibilityBtn',
    'incompatibilitiesList',
    'startWorkoutBtn',
    'todayExercise',
    'moreExercises',
    'showMoreButton',
    'showLessButton',
    'shuffleButton',
    'editMusclesButton',
    'clearDataButton',
    'versionDisplay',
    'progressCount',
    'totalCount',
    'completedWorkouts',
    'lastCompletedAt'
  ].forEach(id => {
    refs[id] = byId(id);
  });
}

function persist() {
  saveState(state);
}

function allMuscles() {
  return [...state.mainMuscles, ...state.additionalMuscles];
}

function syncRules() {
  state.incompatibilities = sanitizeIncompatibilities(state.incompatibilities, allMuscles());
}

function syncAfterWorkoutChange() {
  state.exerciseStates = pruneExerciseStates(state.exerciseStates, state.workoutExercises);
  state.currentWorkoutCompleted = isWorkoutComplete(state.workoutExercises, state.exerciseStates);
}

function addMuscle(type) {
  const input = type === 'main' ? refs.mainMuscleInput : refs.additionalMuscleInput;
  const target = type === 'main' ? state.mainMuscles : state.additionalMuscles;
  const muscleName = normalizeMuscleName(input.value);

  if (!muscleName || hasName([...state.mainMuscles, ...state.additionalMuscles], muscleName)) return;

  target.push(muscleName);
  input.value = '';
  renderSetup();
  persist();
}

function removeMuscle(type, index) {
  const target = type === 'main' ? state.mainMuscles : state.additionalMuscles;
  const removedMuscle = target[index];
  if (!removedMuscle) return;

  const message = type === 'main'
    ? `Usunąć mięsień "${removedMuscle}"? Zniknie też z aktualnego treningu i reguł wykluczeń.`
    : `Usunąć mięsień "${removedMuscle}"? Zniknie z par w aktualnym treningu i reguł wykluczeń.`;

  if (!confirm(message)) return;

  target.splice(index, 1);

  if (type === 'main') {
    state.workoutExercises = removeMainMuscleFromWorkout(state.workoutExercises, removedMuscle);
    state.originalOrder = removeMainMuscleFromWorkout(state.originalOrder, removedMuscle);
  } else {
    state.workoutExercises = stripAdditionalMuscle(state.workoutExercises, removedMuscle);
    state.originalOrder = stripAdditionalMuscle(state.originalOrder, removedMuscle);
  }

  syncRules();
  syncAfterWorkoutChange();
  renderAll();
  persist();
}

function editMuscle(type, index, tagElement, nameElement, removeButton) {
  if (tagElement.classList.contains('editing')) return;

  const target = type === 'main' ? state.mainMuscles : state.additionalMuscles;
  const currentName = target[index];
  if (!currentName) return;

  const input = createElement('input', {
    value: currentName,
    attrs: { maxlength: '24', 'aria-label': `Edytuj ${currentName}` }
  });

  tagElement.classList.add('editing');
  nameElement.hidden = true;
  removeButton.hidden = true;
  tagElement.insertBefore(input, nameElement);
  input.focus();
  input.select();

  let finished = false;

  const finish = shouldSave => {
    if (finished) return;
    finished = true;

    const newName = normalizeMuscleName(input.value);
    if (shouldSave && newName && normalizeMuscleKey(newName) !== normalizeMuscleKey(currentName)) {
      const otherNames = allMuscles().filter(name => normalizeMuscleKey(name) !== normalizeMuscleKey(currentName));
      if (!hasName(otherNames, newName)) {
        target[index] = newName;
        state.workoutExercises = renameMuscleInWorkout(state.workoutExercises, currentName, newName, type);
        state.originalOrder = renameMuscleInWorkout(state.originalOrder, currentName, newName, type);
        state.incompatibilities = state.incompatibilities.map(rule => createIncompatibility(
          normalizeMuscleKey(rule.first) === normalizeMuscleKey(currentName) ? newName : rule.first,
          normalizeMuscleKey(rule.second) === normalizeMuscleKey(currentName) ? newName : rule.second
        )).filter(Boolean);
      }
    }

    renderAll();
    persist();
  };

  input.addEventListener('blur', () => finish(true));
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') finish(true);
    if (event.key === 'Escape') finish(false);
  });
}

function renderMuscleList(type) {
  const list = type === 'main' ? state.mainMuscles : state.additionalMuscles;
  const container = type === 'main' ? refs.mainMusclesList : refs.additionalMusclesList;
  const emptyText = type === 'main' ? 'Dodaj mięśnie główne do treningu' : 'Brak mięśni dodatkowych';

  clearElement(container);
  if (list.length === 0) {
    container.appendChild(createElement('div', { className: 'empty-state compact', text: emptyText }));
    return;
  }

  list.forEach((muscle, index) => {
    const name = createElement('span', { className: 'muscle-name', text: muscle });
    const removeButton = createElement('button', {
      className: 'remove-btn',
      type: 'button',
      text: '×',
      attrs: { 'aria-label': `Usuń ${muscle}` },
      onClick: event => {
        event.stopPropagation();
        removeMuscle(type, index);
      }
    });
    const tag = createElement('div', {
      className: 'muscle-tag',
      attrs: { role: 'button', tabindex: '0', 'aria-label': `Edytuj ${muscle}` }
    }, [name, removeButton]);

    tag.addEventListener('click', () => editMuscle(type, index, tag, name, removeButton));
    tag.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        editMuscle(type, index, tag, name, removeButton);
      }
    });
    container.appendChild(tag);
  });
}

function renderIncompatibilitySelects() {
  const muscles = allMuscles();
  const disabled = muscles.length < 2;

  [refs.incompatibilityFirst, refs.incompatibilitySecond].forEach(select => {
    clearElement(select);
    muscles.forEach(muscle => {
      select.appendChild(createElement('option', { value: muscle, text: muscle }));
    });
    select.disabled = disabled;
  });

  refs.addIncompatibilityBtn.disabled = disabled;
  if (muscles.length >= 2) {
    refs.incompatibilitySecond.selectedIndex = Math.min(1, muscles.length - 1);
  }
}

function addIncompatibility() {
  const rule = createIncompatibility(refs.incompatibilityFirst.value, refs.incompatibilitySecond.value);
  if (!rule) return;
  if (!state.incompatibilities.some(existing => existing.id === rule.id)) {
    state.incompatibilities.push(rule);
  }
  renderIncompatibilities();
  persist();
}

function removeIncompatibility(id) {
  state.incompatibilities = state.incompatibilities.filter(rule => rule.id !== id);
  renderIncompatibilities();
  persist();
}

function renderIncompatibilities() {
  clearElement(refs.incompatibilitiesList);

  if (allMuscles().length < 2) {
    refs.incompatibilitiesList.appendChild(createElement('div', {
      className: 'empty-state compact',
      text: 'Dodaj przynajmniej dwa mięśnie, żeby tworzyć wykluczenia.'
    }));
    return;
  }

  if (state.incompatibilities.length === 0) {
    refs.incompatibilitiesList.appendChild(createElement('div', {
      className: 'empty-state compact',
      text: 'Brak reguł. Dodatkowe mięśnie mogą łączyć się z każdym głównym.'
    }));
    return;
  }

  state.incompatibilities.forEach(rule => {
    const text = createElement('span', { className: 'rule-text', text: `${rule.first} × ${rule.second}` });
    const removeButton = createElement('button', {
      className: 'remove-rule-btn',
      type: 'button',
      text: 'Usuń',
      onClick: () => removeIncompatibility(rule.id)
    });
    refs.incompatibilitiesList.appendChild(createElement('div', { className: 'rule-row' }, [text, removeButton]));
  });
}

function updateStartButton() {
  refs.startWorkoutBtn.disabled = state.mainMuscles.length === 0;
}

function startWorkout() {
  if (state.mainMuscles.length === 0) return;

  if (state.workoutExercises.length === 0) {
    buildNewWorkout();
  }

  showWorkoutScreen();
}

function buildNewWorkout() {
  syncRules();
  state.workoutExercises = generateWorkout(state.mainMuscles, state.additionalMuscles, state.incompatibilities);
  state.originalOrder = [...state.workoutExercises];
  state.exerciseStates = createExerciseStates(state.workoutExercises);
  state.currentWorkoutCompleted = false;
  showMore = false;
  persist();
}

function showSetupScreen() {
  refs.setupScreen.hidden = false;
  refs.workoutScreen.hidden = true;
  renderSetup();
}

function showWorkoutScreen() {
  refs.setupScreen.hidden = true;
  refs.workoutScreen.hidden = false;
  renderWorkout();
}

function renderSetup() {
  syncRules();
  renderMuscleList('main');
  renderMuscleList('additional');
  renderIncompatibilitySelects();
  renderIncompatibilities();
  updateStartButton();
}

function renderProgress() {
  const total = state.workoutExercises.length;
  const done = state.workoutExercises.filter(exercise => state.exerciseStates[exercise.id]).length;
  refs.progressCount.textContent = String(done);
  refs.totalCount.textContent = String(total);
  refs.completedWorkouts.textContent = String(state.stats.completedWorkouts || 0);
  refs.lastCompletedAt.textContent = state.stats.lastCompletedAt
    ? new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit' }).format(new Date(state.stats.lastCompletedAt))
    : 'brak';
}

function createExerciseItem(exercise, featured = false) {
  const isChecked = Boolean(state.exerciseStates[exercise.id]);
  const item = createElement('button', {
    className: `muscle-item${isChecked ? ' checked' : ''}${featured ? ' featured' : ''}`,
    type: 'button',
    attrs: { 'aria-pressed': String(isChecked) },
    onClick: () => toggleExercise(exercise.id)
  }, [
    createElement('span', { className: 'checkbox', text: isChecked ? '✓' : '' }),
    createElement('span', { className: 'muscle-copy' }, [
      createElement('span', { className: 'muscle-text', text: exercise.name }),
      exercise.additionalMuscle ? createElement('span', { className: 'muscle-meta', text: 'połączone ćwiczenie' }) : null
    ])
  ]);
  return item;
}

function renderWorkout() {
  clearElement(refs.todayExercise);
  clearElement(refs.moreExercises);
  renderProgress();

  if (state.workoutExercises.length === 0) {
    renderEmpty(refs.todayExercise, 'Brak ćwiczeń. Wejdź w edycję i dodaj mięśnie główne.');
    setVisible(refs.showMoreButton, false);
    setVisible(refs.showLessButton, false);
    return;
  }

  const complete = isWorkoutComplete(state.workoutExercises, state.exerciseStates);
  if (complete) {
    refs.todayExercise.appendChild(createElement('div', { className: 'completed-state' }, [
      createElement('strong', { text: 'Trening zakończony' }),
      createElement('span', { text: 'Możesz wylosować nową kolejność albo zmienić mięśnie.' })
    ]));
    setVisible(refs.showMoreButton, false);
    setVisible(refs.showLessButton, false);
    return;
  }

  const sortedExercises = getSortedExercises(state.originalOrder, state.exerciseStates, state.workoutExercises);
  const [today, ...remaining] = sortedExercises;

  if (today) refs.todayExercise.appendChild(createExerciseItem(today, true));

  remaining.forEach(exercise => refs.moreExercises.appendChild(createExerciseItem(exercise)));

  const hasRemaining = remaining.length > 0;
  refs.moreExercises.classList.toggle('show', showMore && hasRemaining);
  setVisible(refs.showMoreButton, hasRemaining && !showMore);
  setVisible(refs.showLessButton, hasRemaining && showMore);
}

function renderAll() {
  renderSetup();
  if (!refs.workoutScreen.hidden) renderWorkout();
}

function toggleMoreExercises() {
  showMore = !showMore;
  renderWorkout();
}

function markCompletionIfNeeded() {
  const complete = isWorkoutComplete(state.workoutExercises, state.exerciseStates);
  if (complete && !state.currentWorkoutCompleted) {
    state.currentWorkoutCompleted = true;
    state.stats.completedWorkouts = Number(state.stats.completedWorkouts || 0) + 1;
    state.stats.lastCompletedAt = new Date().toISOString();
  }
}

function toggleExercise(exerciseId) {
  state.exerciseStates[exerciseId] = !state.exerciseStates[exerciseId];
  markCompletionIfNeeded();
  persist();
  renderWorkout();
}

function randomizeOrder(options = {}) {
  const confirmFirst = options.confirmFirst !== false;
  if (confirmFirst && !confirm('Wylosować nową listę? Obecny postęp zostanie zresetowany.')) return;
  buildNewWorkout();
  showWorkoutScreen();
}

async function clearAllData() {
  if (!confirm('Wyczyścić dane tej aplikacji? Usunięte zostaną mięśnie, trening, statystyki oraz cache Workout Randomiser.')) return;
  await clearAppData();
  alert('Dane Workout Randomiser zostały wyczyszczone. Aplikacja zostanie przeładowana.');
  window.location.reload();
}

function bindEvents() {
  refs.mainMuscleInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') addMuscle('main');
  });
  refs.additionalMuscleInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') addMuscle('additional');
  });

  byId('addMainMuscleBtn').addEventListener('click', () => addMuscle('main'));
  byId('addAdditionalMuscleBtn').addEventListener('click', () => addMuscle('additional'));
  refs.addIncompatibilityBtn.addEventListener('click', addIncompatibility);
  refs.startWorkoutBtn.addEventListener('click', startWorkout);
  refs.editMusclesButton.addEventListener('click', showSetupScreen);
  refs.showMoreButton.addEventListener('click', toggleMoreExercises);
  refs.showLessButton.addEventListener('click', toggleMoreExercises);
  refs.shuffleButton.addEventListener('click', () => randomizeOrder());
  refs.clearDataButton.addEventListener('click', clearAllData);
}

function showUpdateNotification(registration) {
  if (updateBannerVisible) return;
  updateBannerVisible = true;

  const banner = createElement('button', {
    className: 'update-banner',
    type: 'button',
    text: 'Dostępna aktualizacja. Kliknij, aby odświeżyć aplikację.',
    onClick: () => {
      registration.waiting?.postMessage({ action: 'skipWaiting' });
    }
  });
  document.body.prepend(banner);
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      registration.update();
      setInterval(() => registration.update(), 60000);

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateNotification(registration);
          }
        });
      });
    } catch (error) {
      console.warn('Nie udało się zarejestrować Service Workera:', error);
    }
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    navigator.serviceWorker.getRegistrations()
      .then(registrations => registrations.forEach(registration => registration.update()))
      .catch(() => {});
  });
}

function handleShortcutAction() {
  if (!window.location.search.includes('action=shuffle')) return;
  if (state.mainMuscles.length === 0) return;
  randomizeOrder({ confirmFirst: false });
}

function init() {
  collectRefs();
  bindEvents();
  refs.versionDisplay.textContent = `v${config.VERSION}`;

  syncRules();
  if (state.workoutExercises.length === 0 && state.mainMuscles.length > 0) {
    buildNewWorkout();
  }

  if (state.mainMuscles.length === 0) {
    showSetupScreen();
  } else {
    showWorkoutScreen();
  }

  handleShortcutAction();
  registerServiceWorker();
}

document.addEventListener('DOMContentLoaded', init);
