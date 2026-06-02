export function normalizeMuscleName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function normalizeMuscleKey(value) {
  return normalizeMuscleName(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/ł/g, 'l');
}

export function hasName(list, name) {
  const key = normalizeMuscleKey(name);
  return list.some(entry => normalizeMuscleKey(entry) === key);
}

export function shuffleArray(array) {
  const copy = [...array];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function pairKey(first, second) {
  return [normalizeMuscleKey(first), normalizeMuscleKey(second)]
    .sort()
    .join('::');
}

export function createIncompatibility(first, second) {
  const firstName = normalizeMuscleName(first);
  const secondName = normalizeMuscleName(second);
  if (!firstName || !secondName || normalizeMuscleKey(firstName) === normalizeMuscleKey(secondName)) {
    return null;
  }
  return {
    id: pairKey(firstName, secondName),
    first: firstName,
    second: secondName
  };
}

export function isPairBlocked(first, second, incompatibilities = []) {
  const key = pairKey(first, second);
  return incompatibilities.some(rule => rule?.id === key || pairKey(rule?.first, rule?.second) === key);
}

export function sanitizeIncompatibilities(incompatibilities = [], muscles = []) {
  const muscleKeys = new Set(muscles.map(normalizeMuscleKey));
  const unique = new Map();

  incompatibilities.forEach(rule => {
    const normalized = createIncompatibility(rule?.first, rule?.second);
    if (!normalized) return;
    if (muscleKeys.size > 0 && (!muscleKeys.has(normalizeMuscleKey(normalized.first)) || !muscleKeys.has(normalizeMuscleKey(normalized.second)))) {
      return;
    }
    unique.set(normalized.id, normalized);
  });

  return [...unique.values()];
}

export function renameMuscleInWorkout(exercises = [], oldName, newName, type) {
  const oldKey = normalizeMuscleKey(oldName);
  const nextName = normalizeMuscleName(newName);

  return exercises.map(exercise => {
    if (type === 'main' && normalizeMuscleKey(exercise.mainMuscle) === oldKey) {
      const name = exercise.additionalMuscle ? `${nextName} + ${exercise.additionalMuscle}` : nextName;
      return { ...exercise, mainMuscle: nextName, name };
    }

    if (type === 'additional' && normalizeMuscleKey(exercise.additionalMuscle) === oldKey) {
      return { ...exercise, additionalMuscle: nextName, name: `${exercise.mainMuscle} + ${nextName}` };
    }

    return exercise;
  });
}

export function stripAdditionalMuscle(exercises = [], removedMuscle) {
  const removedKey = normalizeMuscleKey(removedMuscle);
  return exercises.map(exercise => {
    if (normalizeMuscleKey(exercise.additionalMuscle) !== removedKey) return exercise;
    return { ...exercise, name: exercise.mainMuscle, additionalMuscle: null };
  });
}

export function removeMainMuscleFromWorkout(exercises = [], removedMuscle) {
  const removedKey = normalizeMuscleKey(removedMuscle);
  return exercises.filter(exercise => normalizeMuscleKey(exercise.mainMuscle) !== removedKey);
}

export function makeExerciseId(mainMuscle, additionalMuscle, index) {
  const base = normalizeMuscleKey([mainMuscle, additionalMuscle].filter(Boolean).join(' '))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${index + 1}-${base || 'exercise'}`;
}

export function generateWorkout(mainMuscles = [], additionalMuscles = [], incompatibilities = []) {
  const shuffledMain = shuffleArray(mainMuscles.map(normalizeMuscleName).filter(Boolean));
  const shuffledAdditional = shuffleArray(additionalMuscles.map(normalizeMuscleName).filter(Boolean));
  const exercises = shuffledMain.map((mainMuscle, index) => ({
    id: makeExerciseId(mainMuscle, null, index),
    name: mainMuscle,
    mainMuscle,
    additionalMuscle: null
  }));

  const freePositions = new Set(exercises.map((_exercise, index) => index));

  shuffledAdditional.forEach(additionalMuscle => {
    const compatiblePositions = [...freePositions].filter(index => (
      !isPairBlocked(exercises[index].mainMuscle, additionalMuscle, incompatibilities)
    ));

    if (compatiblePositions.length === 0) return;

    const picked = compatiblePositions[Math.floor(Math.random() * compatiblePositions.length)];
    const exercise = exercises[picked];
    exercise.additionalMuscle = additionalMuscle;
    exercise.name = `${exercise.mainMuscle} + ${additionalMuscle}`;
    exercise.id = makeExerciseId(exercise.mainMuscle, additionalMuscle, picked);
    freePositions.delete(picked);
  });

  return exercises;
}

export function createExerciseStates(exercises = []) {
  return exercises.reduce((states, exercise) => {
    states[exercise.id] = false;
    return states;
  }, {});
}

export function pruneExerciseStates(states = {}, exercises = []) {
  const validIds = new Set(exercises.map(exercise => exercise.id));
  return Object.fromEntries(Object.entries(states).filter(([id]) => validIds.has(id)));
}

export function getSortedExercises(originalOrder = [], states = {}, fallbackExercises = []) {
  const source = originalOrder.length > 0 ? originalOrder : fallbackExercises;
  const unchecked = [];
  const checked = [];

  source.forEach(exercise => {
    if (states[exercise.id]) {
      checked.push(exercise);
    } else {
      unchecked.push(exercise);
    }
  });

  return [...unchecked, ...checked];
}

export function isWorkoutComplete(exercises = [], states = {}) {
  return exercises.length > 0 && exercises.every(exercise => states[exercise.id]);
}
