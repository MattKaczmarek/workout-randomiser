import { sanitizeIncompatibilities } from './workout.mjs';

const config = globalThis.WorkoutConfig;

export function createInitialState() {
  return {
    mainMuscles: [],
    additionalMuscles: [],
    incompatibilities: [],
    workoutExercises: [],
    exerciseStates: {},
    originalOrder: [],
    currentWorkoutCompleted: false,
    stats: {
      completedWorkouts: 0,
      lastCompletedAt: null
    }
  };
}

export function normalizeState(rawState = {}) {
  const state = createInitialState();
  state.mainMuscles = Array.isArray(rawState.mainMuscles) ? rawState.mainMuscles.filter(Boolean) : [];
  state.additionalMuscles = Array.isArray(rawState.additionalMuscles) ? rawState.additionalMuscles.filter(Boolean) : [];
  state.workoutExercises = Array.isArray(rawState.workoutExercises) ? rawState.workoutExercises : [];
  state.exerciseStates = rawState.exerciseStates && typeof rawState.exerciseStates === 'object' ? rawState.exerciseStates : {};
  state.originalOrder = Array.isArray(rawState.originalOrder) ? rawState.originalOrder : [];
  state.currentWorkoutCompleted = Boolean(rawState.currentWorkoutCompleted);
  state.stats = {
    completedWorkouts: Number(rawState.stats?.completedWorkouts || 0),
    lastCompletedAt: rawState.stats?.lastCompletedAt || null
  };
  state.incompatibilities = sanitizeIncompatibilities(rawState.incompatibilities || [], [
    ...state.mainMuscles,
    ...state.additionalMuscles
  ]);
  return state;
}

export function loadState() {
  try {
    const saved = localStorage.getItem(config.STORAGE_KEY);
    return saved ? normalizeState(JSON.parse(saved)) : createInitialState();
  } catch (error) {
    console.warn('Nie udało się odczytać danych treningu:', error);
    return createInitialState();
  }
}

export function saveState(state) {
  localStorage.setItem(config.STORAGE_KEY, JSON.stringify(normalizeState(state)));
}

export async function clearAppData() {
  localStorage.removeItem(config.STORAGE_KEY);
  sessionStorage.removeItem(config.STORAGE_KEY);

  if (!('caches' in globalThis)) return;

  const cacheNames = await caches.keys();
  await Promise.all(cacheNames
    .filter(name => name.startsWith(config.CACHE_PREFIX))
    .map(name => caches.delete(name)));
}
