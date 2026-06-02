import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createIncompatibility,
  generateWorkout,
  hasName,
  isPairBlocked,
  sanitizeIncompatibilities
} from '../scripts/workout.mjs';

test('blocks incompatible main and additional muscle pairings', () => {
  const rules = [createIncompatibility('Klatka', 'Triceps')];

  for (let index = 0; index < 80; index += 1) {
    const workout = generateWorkout(['Klatka', 'Plecy'], ['Triceps'], rules);
    const blocked = workout.find(exercise => exercise.mainMuscle === 'Klatka' && exercise.additionalMuscle === 'Triceps');
    assert.equal(blocked, undefined);
  }
});

test('omits an additional muscle when all compatible positions are blocked', () => {
  const rules = [
    createIncompatibility('Klatka', 'Brzuch'),
    createIncompatibility('Plecy', 'Brzuch')
  ];
  const workout = generateWorkout(['Klatka', 'Plecy'], ['Brzuch'], rules);

  assert.equal(workout.some(exercise => exercise.additionalMuscle === 'Brzuch'), false);
});

test('normalizes duplicate names and rules case-insensitively', () => {
  assert.equal(hasName(['Klatka'], ' klatka '), true);
  assert.equal(isPairBlocked('TRICEPS', 'klatka', [createIncompatibility('Klatka', 'Triceps')]), true);

  const rules = sanitizeIncompatibilities([
    createIncompatibility('Klatka', 'Triceps'),
    createIncompatibility('triceps', 'klatka'),
    createIncompatibility('Klatka', 'Klatka')
  ], ['Klatka', 'Triceps']);

  assert.equal(rules.length, 1);
});
