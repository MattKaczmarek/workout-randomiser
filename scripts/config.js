(function exposeWorkoutConfig(global) {
  const version = '3.4.0';
  const cachePrefix = 'workout-randomiser-';

  global.WorkoutConfig = Object.freeze({
    VERSION: version,
    STORAGE_KEY: 'workoutRandomiser',
    CACHE_PREFIX: cachePrefix,
    CACHE_NAME: `${cachePrefix}v${version}`,
    ASSETS: [
      './',
      './index.html',
      './style.css',
      './manifest.json',
      './scripts/config.js',
      './scripts/app.mjs',
      './scripts/dom.mjs',
      './scripts/storage.mjs',
      './scripts/workout.mjs'
    ]
  });
})(globalThis);
