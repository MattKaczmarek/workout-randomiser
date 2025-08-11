// Globalne zmienne
let mainMuscles = [];
let additionalMuscles = [];
let workoutExercises = [];
let exerciseStates = {};
let showMore = false;

// Funkcje localStorage
function saveData() {
    const data = {
        mainMuscles: mainMuscles,
        additionalMuscles: additionalMuscles,
        workoutExercises: workoutExercises,
        exerciseStates: exerciseStates
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
    }
}

function clearAllData() {
    if (confirm('Czy na pewno chcesz wyczyścić wszystkie zapisane dane?')) {
        localStorage.removeItem('workoutRandomiser');
        mainMuscles = [];
        additionalMuscles = [];
        workoutExercises = [];
        exerciseStates = {};
        showSetupScreen();
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
    }
}

function addAdditionalMuscle() {
    const input = document.getElementById('additionalMuscleInput');
    const muscleName = input.value.trim();
    
    if (muscleName && !additionalMuscles.includes(muscleName)) {
        additionalMuscles.push(muscleName);
        input.value = '';
        renderAdditionalMusclesList();
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

function loadDefaultWorkout() {
    mainMuscles = ['Nogi', 'Klatka', 'Plecy', 'Ramiona', 'Biceps', 'Triceps'];
    additionalMuscles = ['Brzuch', 'Łydki'];
    
    renderMainMusclesList();
    renderAdditionalMusclesList();
    updateStartButton();
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
    
    // Dla każdego mięśnia głównego
    shuffledMain.forEach((mainMuscle, index) => {
        let exerciseName = mainMuscle;
        let exerciseId = `main_${index}`;
        let additionalMuscle = null;
        
        // Jeśli są dostępne mięśnie dodatkowe, sparuj z losowym
        if (shuffledAdditional.length > 0) {
            additionalMuscle = shuffledAdditional[index % shuffledAdditional.length];
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
    
    workoutExercises = generateWorkout();
    exerciseStates = {};
    
    // Zresetuj stany ćwiczeń
    workoutExercises.forEach(exercise => {
        exerciseStates[exercise.id] = false;
    });
    
    showMore = false;
    saveData();
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
    
    // Posortuj ćwiczenia: nieodhaczone na górze, odhaczone na dole
    const sortedExercises = [...workoutExercises].sort((a, b) => {
        const aChecked = exerciseStates[a.id] || false;
        const bChecked = exerciseStates[b.id] || false;
        
        // Nieodhaczone (false) na górze, odhaczone (true) na dole
        if (aChecked === bChecked) return 0;
        return aChecked ? 1 : -1;
    });
    
    // Pierwsze nieodhaczone ćwiczenie - "na dzisiaj"
    const firstUncheckedExercise = sortedExercises.find(exercise => !exerciseStates[exercise.id]);
    
    if (firstUncheckedExercise) {
        const exerciseItem = document.createElement('div');
        exerciseItem.className = 'muscle-item';
        exerciseItem.onclick = () => toggleExercise(firstUncheckedExercise.id);
        
        exerciseItem.innerHTML = `
            <div class="checkbox"></div>
            <div>
                <div class="muscle-text">${firstUncheckedExercise.name}</div>
            </div>
        `;
        
        todayExercise.appendChild(exerciseItem);
    }
    
    // Pozostałe ćwiczenia
    const remainingExercises = sortedExercises.filter(exercise => exercise.id !== firstUncheckedExercise?.id);
    
    if (remainingExercises.length > 0) {
        remainingExercises.forEach((exercise) => {
            const isChecked = exerciseStates[exercise.id];
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
    
    saveData();
}

function toggleMoreExercises() {
    showMore = !showMore;
    renderWorkoutExercises();
}

function toggleExercise(exerciseId) {
    exerciseStates[exerciseId] = !exerciseStates[exerciseId];
    renderWorkoutExercises();
}

function randomizeOrder() {
    if (confirm('Czy na pewno chcesz wylosować nową listę? Obecny postęp zostanie zresetowany.')) {
        workoutExercises = generateWorkout();
        exerciseStates = {};
        
        // Zresetuj stany ćwiczeń
        workoutExercises.forEach(exercise => {
            exerciseStates[exercise.id] = false;
        });
        
        showMore = false;
        renderWorkoutExercises();
    }
}

function resetWorkout() {
    if (confirm('Czy na pewno chcesz zresetować postęp treningu?')) {
        exerciseStates = {};
        
        // Zresetuj stany ćwiczeń
        workoutExercises.forEach(exercise => {
            exerciseStates[exercise.id] = false;
        });
        
        showMore = false;
        renderWorkoutExercises();
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
        background: #ff4444;
        color: white;
        padding: 20px;
        text-align: center;
        z-index: 1000;
        cursor: pointer;
        font-weight: bold;
        font-size: 16px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    updateBanner.innerHTML = '🚀 WAŻNA AKTUALIZACJA! Kliknij aby zainstalować nową wersję';
    updateBanner.onclick = () => {
        // Wyczyść localStorage dla pewności
        localStorage.clear();
        // Przeładuj stronę
        window.location.reload(true);
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
    if (mainMuscles.length === 0) {
        // Ustaw domyślne mięśnie dla nowych użytkowników
        loadDefaultWorkout();
        workoutExercises = generateWorkout();
        exerciseStates = {};
        workoutExercises.forEach(exercise => {
            exerciseStates[exercise.id] = false;
        });
        saveData();
    }
    
    // Jeśli nie ma wygenerowanego treningu, wygeneruj go
    if (workoutExercises.length === 0 && mainMuscles.length > 0) {
        workoutExercises = generateWorkout();
        exerciseStates = {};
        workoutExercises.forEach(exercise => {
            exerciseStates[exercise.id] = false;
        });
        saveData();
    }
    
    showWorkoutScreen();
});