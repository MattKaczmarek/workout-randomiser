// Globalne zmienne
let mainMuscles = [];
let additionalMuscles = [];
let workoutExercises = [];
let exerciseStates = {};
let originalOrder = [];
let showMore = false;

// Funkcje localStorage
function saveData() {
    const data = {
        mainMuscles: mainMuscles,
        additionalMuscles: additionalMuscles,
        workoutExercises: workoutExercises,
        exerciseStates: exerciseStates,
        originalOrder: originalOrder
    };
    localStorage.setItem('workoutRandomiser', JSON.stringify(data));
}

function loadData() {
    const saved = localStorage.getItem('workoutRandomiser');
    if (saved) {
        const data = JSON.parse(saved);
        mainMuscles = data.mainMuscles || [];
        additionalMuscles = data.additionalMuscles || [];
        workoutExercises = data.workoutExercises || [];
        exerciseStates = data.exerciseStates || {};
        originalOrder = data.originalOrder || [];
    }
}

function clearAllData() {
    if (confirm('Czy na pewno chcesz wyczyścić WSZYSTKIE dane aplikacji? Ta operacja usunie również cache aplikacji i nie można jej cofnąć.')) {
        // Agresywne czyszczenie wszystkiego
        localStorage.clear(); // Wyczyść cały localStorage
        sessionStorage.clear(); // Wyczyść sessionStorage
        
        // Wyczyść cache aplikacji
        if ('caches' in window) {
            caches.keys().then(function(names) {
                for (let name of names) {
                    caches.delete(name);
                }
            });
        }
        
        // Zresetuj zmienne
        mainMuscles = [];
        additionalMuscles = [];
        workoutExercises = [];
        exerciseStates = {};
        originalOrder = [];
        
        // Przeładuj aplikację żeby mieć pewność że wszystko się zresetowało
        alert('Wszystkie dane zostały wyczyszczone. Aplikacja zostanie przeładowana.');
        window.location.reload(true);
    }
}

// Funkcje setup ekranu
function addMainMuscle() {
    const input = document.getElementById('mainMuscleInput');
    const muscleName = input.value.trim();
    
    if (muscleName && !mainMuscles.includes(muscleName)) {
        mainMuscles.push(muscleName);
        input.value = '';
        renderMainMusclesList();
        updateStartButton();
        saveData(); // Zapisz bez wpływu na obecny trening
    }
}

function addAdditionalMuscle() {
    const input = document.getElementById('additionalMuscleInput');
    const muscleName = input.value.trim();
    
    if (muscleName && !additionalMuscles.includes(muscleName)) {
        additionalMuscles.push(muscleName);
        input.value = '';
        renderAdditionalMusclesList();
        saveData(); // Zapisz bez wpływu na obecny trening
    }
}

function removeMainMuscle(index) {
    const removedMuscle = mainMuscles[index];
    
    if (confirm(`Czy na pewno chcesz usunąć mięsień "${removedMuscle}"? Zostanie on również usunięty z aktualnego treningu.`)) {
        mainMuscles.splice(index, 1);
        
        // Usuń z aktualnego treningu bez resetowania postępu
        workoutExercises = workoutExercises.filter(exercise => exercise.mainMuscle !== removedMuscle);
        
        renderMainMusclesList();
        updateStartButton();
        
        // Jeśli jesteśmy na ekranie treningu, odśwież go
        if (document.getElementById('workoutScreen').style.display !== 'none') {
            renderWorkoutExercises();
        }
        
        saveData();
    }
}

function removeAdditionalMuscle(index) {
    const removedMuscle = additionalMuscles[index];
    
    if (confirm(`Czy na pewno chcesz usunąć mięsień "${removedMuscle}"? Zostanie on usunięty z par w aktualnym treningu.`)) {
        additionalMuscles.splice(index, 1);
        
        // Usuń z aktualnego treningu - znajdź ćwiczenia które zawierają ten mięsień dodatkowy
        workoutExercises = workoutExercises.map(exercise => {
            if (exercise.additionalMuscle === removedMuscle) {
                return {
                    ...exercise,
                    name: exercise.mainMuscle, // Zostaw tylko główny mięsień
                    additionalMuscle: null
                };
            }
            return exercise;
        });
        
        renderAdditionalMusclesList();
        
        // Jeśli jesteśmy na ekranie treningu, odśwież go
        if (document.getElementById('workoutScreen').style.display !== 'none') {
            renderWorkoutExercises();
        }
        
        saveData();
    }
}

function editMuscle(type, index) {
    const container = type === 'main' ? document.getElementById('mainMusclesList') : document.getElementById('additionalMusclesList');
    const muscleTag = container.children[index];
    const nameSpan = muscleTag.querySelector('.muscle-name');
    const removeBtn = muscleTag.querySelector('.remove-btn');
    const currentName = nameSpan.textContent;
    
    // Utwórz input do edycji
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.maxLength = 20;
    
    // Zastąp span inputem
    nameSpan.style.display = 'none';
    removeBtn.style.display = 'none';
    muscleTag.classList.add('editing');
    muscleTag.insertBefore(input, nameSpan);
    
    input.focus();
    input.select();
    
    function saveEdit() {
        const newName = input.value.trim();
        
        if (newName && newName !== currentName) {
            // Sprawdź czy nazwa nie jest już zajęta
            const existingNames = type === 'main' ? mainMuscles : additionalMuscles;
            if (!existingNames.includes(newName)) {
                // Aktualizuj nazwę
                if (type === 'main') {
                    const oldName = mainMuscles[index];
                    mainMuscles[index] = newName;
                    
                    // Aktualizuj w aktualnym treningu
                    workoutExercises = workoutExercises.map(exercise => {
                        if (exercise.mainMuscle === oldName) {
                            const updatedName = exercise.additionalMuscle 
                                ? `${newName} + ${exercise.additionalMuscle}`
                                : newName;
                            return {
                                ...exercise,
                                mainMuscle: newName,
                                name: updatedName
                            };
                        }
                        return exercise;
                    });
                } else {
                    const oldName = additionalMuscles[index];
                    additionalMuscles[index] = newName;
                    
                    // Aktualizuj w aktualnym treningu
                    workoutExercises = workoutExercises.map(exercise => {
                        if (exercise.additionalMuscle === oldName) {
                            return {
                                ...exercise,
                                additionalMuscle: newName,
                                name: `${exercise.mainMuscle} + ${newName}`
                            };
                        }
                        return exercise;
                    });
                }
                
                saveData();
            }
        }
        
        // Przywróć normalny widok
        muscleTag.removeChild(input);
        nameSpan.style.display = '';
        removeBtn.style.display = '';
        muscleTag.classList.remove('editing');
        
        // Odśwież listy
        if (type === 'main') {
            renderMainMusclesList();
        } else {
            renderAdditionalMusclesList();
        }
        
        // Jeśli jesteśmy na ekranie treningu, odśwież go
        if (document.getElementById('workoutScreen').style.display !== 'none') {
            renderWorkoutExercises();
        }
    }
    
    function cancelEdit() {
        muscleTag.removeChild(input);
        nameSpan.style.display = '';
        removeBtn.style.display = '';
        muscleTag.classList.remove('editing');
    }
    
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveEdit();
        } else if (e.key === 'Escape') {
            cancelEdit();
        }
    });
}

function renderMainMusclesList() {
    const container = document.getElementById('mainMusclesList');
    
    if (mainMuscles.length === 0) {
        container.innerHTML = '<div class="empty-state">Dodaj mięśnie główne do treningu</div>';
        return;
    }
    
    container.innerHTML = mainMuscles.map((muscle, index) => `
        <div class="muscle-tag" onclick="editMuscle('main', ${index})">
            <span class="muscle-name">${muscle}</span>
            <button class="remove-btn" onclick="event.stopPropagation(); removeMainMuscle(${index})">×</button>
        </div>
    `).join('');
}

function renderAdditionalMusclesList() {
    const container = document.getElementById('additionalMusclesList');
    
    if (additionalMuscles.length === 0) {
        container.innerHTML = '<div class="empty-state">Brak mięśni dodatkowych</div>';
        return;
    }
    
    container.innerHTML = additionalMuscles.map((muscle, index) => `
        <div class="muscle-tag" onclick="editMuscle('additional', ${index})">
            <span class="muscle-name">${muscle}</span>
            <button class="remove-btn" onclick="event.stopPropagation(); removeAdditionalMuscle(${index})">×</button>
        </div>
    `).join('');
}

function updateStartButton() {
    const button = document.getElementById('startWorkoutBtn');
    button.disabled = mainMuscles.length === 0;
}


// Funkcje generowania treningu
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function generateWorkout() {
    const shuffledMain = shuffleArray(mainMuscles);
    const shuffledAdditional = shuffleArray(additionalMuscles);
    const exercises = [];
    
    // Wygeneruj losowe pozycje dla mięśni dodatkowych
    let randomPositions = [];
    if (shuffledAdditional.length > 0) {
        // Wylosuj pozycje od 0 do długość głównych mięśni
        const availablePositions = Array.from({length: shuffledMain.length}, (_, i) => i);
        randomPositions = shuffleArray(availablePositions).slice(0, shuffledAdditional.length);
    }
    
    // Dla każdego mięśnia głównego
    shuffledMain.forEach((mainMuscle, index) => {
        let exerciseName = mainMuscle;
        let exerciseId = `main_${index}`;
        let additionalMuscle = null;
        
        // Sprawdź czy ta pozycja ma dostać mięsień dodatkowy
        const additionalIndex = randomPositions.indexOf(index);
        if (additionalIndex !== -1 && shuffledAdditional[additionalIndex]) {
            additionalMuscle = shuffledAdditional[additionalIndex];
            exerciseName = `${mainMuscle} + ${additionalMuscle}`;
            exerciseId = `combo_${index}`;
        }
        
        exercises.push({
            id: exerciseId,
            name: exerciseName,
            mainMuscle: mainMuscle,
            additionalMuscle: additionalMuscle
        });
    });
    
    return exercises;
}

function startWorkout() {
    if (mainMuscles.length === 0) return;
    
    // Jeśli nie ma wygenerowanego treningu, wygeneruj go
    if (workoutExercises.length === 0) {
        workoutExercises = generateWorkout();
        originalOrder = [...workoutExercises]; // Zachowaj oryginalną kolejność
        exerciseStates = {};
        
        // Zresetuj stany ćwiczeń
        workoutExercises.forEach(exercise => {
            exerciseStates[exercise.id] = false;
        });
        
        showMore = false;
        saveData();
    }
    
    showWorkoutScreen();
}

// Funkcje nawigacji między ekranami
function showSetupScreen() {
    document.getElementById('setupScreen').style.display = 'block';
    document.getElementById('workoutScreen').style.display = 'none';
    
    renderMainMusclesList();
    renderAdditionalMusclesList();
    updateStartButton();
}

function showWorkoutScreen() {
    document.getElementById('setupScreen').style.display = 'none';
    document.getElementById('workoutScreen').style.display = 'block';
    
    renderWorkoutExercises();
}

// Funkcje treningu
function getSortedExercises() {
    if (originalOrder.length === 0) {
        return workoutExercises;
    }
    
    // Podziel ćwiczenia na niezaznaczone i zaznaczone, zachowując oryginalną kolejność
    const uncheckedExercises = [];
    const checkedExercises = [];
    
    originalOrder.forEach(exercise => {
        if (exerciseStates[exercise.id]) {
            checkedExercises.push(exercise);
        } else {
            uncheckedExercises.push(exercise);
        }
    });
    
    // Zwróć: najpierw niezaznaczone (w oryginalnej kolejności), potem zaznaczone na dole (w oryginalnej kolejności)
    return [...uncheckedExercises, ...checkedExercises];
}

function renderWorkoutExercises() {
    const todayExercise = document.getElementById('todayExercise');
    const moreExercises = document.getElementById('moreExercises');
    const showMoreButton = document.getElementById('showMoreButton');
    const showLessButton = document.getElementById('showLessButton');
    
    // Wyczyść
    todayExercise.innerHTML = '';
    moreExercises.innerHTML = '';
    
    if (workoutExercises.length === 0) {
        todayExercise.innerHTML = '<div class="empty-state">Brak ćwiczeń</div>';
        showMoreButton.style.display = 'none';
        showLessButton.style.display = 'none';
        return;
    }
    
    // Pobierz posortowane ćwiczenia (niezaznaczone na dole)
    const sortedExercises = getSortedExercises();
    
    // Ćwiczenie "na dzisiaj" to zawsze pierwsze z posortowanych ćwiczeń
    const todayExerciseData = sortedExercises.length > 0 ? sortedExercises[0] : null;
    
    if (todayExerciseData) {
        const isChecked = exerciseStates[todayExerciseData.id] || false;
        const exerciseItem = document.createElement('div');
        exerciseItem.className = `muscle-item ${isChecked ? 'checked' : ''}`;
        exerciseItem.onclick = () => toggleExercise(todayExerciseData.id);
        
        exerciseItem.innerHTML = `
            <div class="checkbox">${isChecked ? '✓' : ''}</div>
            <div>
                <div class="muscle-text">${todayExerciseData.name}</div>
            </div>
        `;
        
        todayExercise.appendChild(exerciseItem);
    }
    
    // Pozostałe ćwiczenia (wszystkie poza pierwszym z posortowanych)
    const remainingExercises = sortedExercises.slice(1);
    
    if (remainingExercises.length > 0) {
        remainingExercises.forEach((exercise) => {
            const isChecked = exerciseStates[exercise.id] || false;
            const exerciseItem = document.createElement('div');
            exerciseItem.className = `muscle-item ${isChecked ? 'checked' : ''}`;
            exerciseItem.onclick = () => toggleExercise(exercise.id);
            
            exerciseItem.innerHTML = `
                <div class="checkbox">${isChecked ? '✓' : ''}</div>
                <div>
                    <div class="muscle-text">${exercise.name}</div>
                </div>
            `;
            
            moreExercises.appendChild(exerciseItem);
        });
        
        // Pokaż właściwe przyciski
        if (showMore) {
            showMoreButton.style.display = 'none';
            showLessButton.style.display = 'block';
            moreExercises.classList.add('show');
        } else {
            showMoreButton.style.display = 'block';
            showLessButton.style.display = 'none';
            moreExercises.classList.remove('show');
        }
    } else {
        showMoreButton.style.display = 'none';
        showLessButton.style.display = 'none';
    }
}

function toggleMoreExercises() {
    showMore = !showMore;
    renderWorkoutExercises();
}

function toggleExercise(exerciseId) {
    exerciseStates[exerciseId] = !exerciseStates[exerciseId];
    renderWorkoutExercises();
    saveData();
}

function randomizeOrder() {
    if (confirm('Czy na pewno chcesz wylosować nową listę? Obecny postęp zostanie zresetowany.')) {
        workoutExercises = generateWorkout();
        originalOrder = [...workoutExercises]; // Nowa oryginalna kolejność
        exerciseStates = {};
        
        // Zresetuj stany ćwiczeń
        workoutExercises.forEach(exercise => {
            exerciseStates[exercise.id] = false;
        });
        
        showMore = false;
        renderWorkoutExercises();
        saveData();
    }
}


// Obsługa klawiatury
function handleKeyPress(event, inputType) {
    if (event.key === 'Enter') {
        if (inputType === 'main') {
            addMainMuscle();
        } else if (inputType === 'additional') {
            addAdditionalMuscle();
        }
    }
}

// Rejestracja Service Worker z obsługą aktualizacji
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js')
            .then(function(registration) {
                console.log('Service Worker zarejestrowany:', registration.scope);
                
                // Wymusza sprawdzenie aktualizacji przy każdym uruchomieniu
                registration.update();
                
                // Sprawdź czy jest nowa wersja
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                // Nowa wersja dostępna
                                showUpdateNotification();
                            }
                        }
                    });
                });
            })
            .catch(function(error) {
                console.log('Błąd Service Worker:', error);
            });
            
        // Nasłuchuj wiadomości od Service Worker
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            // Service Worker został zaktualizowany
            window.location.reload();
        });
    });
}

// Pokaż powiadomienie o aktualizacji
function showUpdateNotification() {
    const updateBanner = document.createElement('div');
    updateBanner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #28a745;
        color: white;
        padding: 15px;
        text-align: center;
        z-index: 1000;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    updateBanner.innerHTML = '🔄 Dostępna aktualizacja! Kliknij aby zainstalować';
    updateBanner.onclick = () => {
        // NIE czyść localStorage - zachowaj dane użytkownika
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({action: 'skipWaiting'});
        }
    };
    document.body.insertBefore(updateBanner, document.body.firstChild);
}

// Obsługa skrótów z manifestu
if (window.location.search.includes('action=shuffle')) {
    // Automatyczne losowanie przy uruchomieniu ze skrótu
    setTimeout(() => {
        if (workoutExercises.length > 0) {
            randomizeOrder();
        }
    }, 500);
}

// Inicjalizacja po załadowaniu strony
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    
    // Dodaj event listenery do inputów
    document.getElementById('mainMuscleInput').addEventListener('keypress', (e) => handleKeyPress(e, 'main'));
    document.getElementById('additionalMuscleInput').addEventListener('keypress', (e) => handleKeyPress(e, 'additional'));
    
    // Zawsze otwórz ekran treningu
    // Jeśli nie ma skonfigurowanych mięśni, pokaż pusty ekran z przyciskiem edycji
    
    // Jeśli nie ma wygenerowanego treningu, wygeneruj go
    if (workoutExercises.length === 0 && mainMuscles.length > 0) {
        workoutExercises = generateWorkout();
        originalOrder = [...workoutExercises];
        exerciseStates = {};
        workoutExercises.forEach(exercise => {
            exerciseStates[exercise.id] = false;
        });
        saveData();
    }
    
    showWorkoutScreen();
});