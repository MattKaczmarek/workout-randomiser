const MUSCLES = [
    'Nogi',
    'Łydki', 
    'Ramiona',
    'Biceps',
    'Triceps',
    'Plecy',
    'Klatka',
    'Brzuch'
];

let muscleStates = {};
let muscleOrder = [...MUSCLES];
let showMore = false;

// Funkcje localStorage
function saveData() {
    const data = {
        muscleStates: muscleStates,
        muscleOrder: muscleOrder
    };
    localStorage.setItem('workoutRandomiser', JSON.stringify(data));
}

function loadData() {
    const saved = localStorage.getItem('workoutRandomiser');
    if (saved) {
        const data = JSON.parse(saved);
        muscleStates = data.muscleStates || {};
        muscleOrder = data.muscleOrder || [...MUSCLES];
    }
    
    // Upewnij się, że wszystkie mięśnie mają stan
    MUSCLES.forEach(muscle => {
        if (muscleStates[muscle] === undefined) {
            muscleStates[muscle] = false;
        }
    });
}

function clearAllData() {
    if (confirm('Czy na pewno chcesz wyczyścić wszystkie zapisane dane?')) {
        localStorage.removeItem('workoutRandomiser');
        // Reset do wartości domyślnych
        muscleStates = {};
        muscleOrder = [...MUSCLES];
        
        MUSCLES.forEach(muscle => {
            muscleStates[muscle] = false;
        });
        
        showMore = false;
        renderExercises();
    }
}

// Funkcje do zarządzania mięśniami
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function renderExercises() {
    const todayExercise = document.getElementById('todayExercise');
    const moreExercises = document.getElementById('moreExercises');
    const showMoreButton = document.getElementById('showMoreButton');
    const showLessButton = document.getElementById('showLessButton');
    
    // Wyczyść
    todayExercise.innerHTML = '';
    moreExercises.innerHTML = '';
    
    if (muscleOrder.length > 0) {
        // Posortuj mięśnie: nieodhaczone na górze, odhaczone na dole
        const sortedMuscles = [...muscleOrder].sort((a, b) => {
            const aChecked = muscleStates[a] || false;
            const bChecked = muscleStates[b] || false;
            
            // Nieodhaczone (false) na górze, odhaczone (true) na dole
            if (aChecked === bChecked) return 0;
            return aChecked ? 1 : -1;
        });
        
        // Pierwsze nieodhaczone ćwiczenie - "na dzisiaj"
        const firstUncheckedMuscle = sortedMuscles.find(muscle => !muscleStates[muscle]);
        
        if (firstUncheckedMuscle) {
            const muscleItem = document.createElement('div');
            muscleItem.className = 'muscle-item';
            muscleItem.onclick = () => toggleMuscle(firstUncheckedMuscle);
            
            muscleItem.innerHTML = `
                <div class="checkbox"></div>
                <div class="muscle-text">${firstUncheckedMuscle}</div>
            `;
            
            todayExercise.appendChild(muscleItem);
        }
        
        // Pozostałe ćwiczenia
        const remainingMuscles = sortedMuscles.filter(muscle => muscle !== firstUncheckedMuscle);
        
        if (remainingMuscles.length > 0) {
            remainingMuscles.forEach((muscle) => {
                const isChecked = muscleStates[muscle];
                const muscleItem = document.createElement('div');
                muscleItem.className = `muscle-item ${isChecked ? 'checked' : ''}`;
                muscleItem.onclick = () => toggleMuscle(muscle);
                
                muscleItem.innerHTML = `
                    <div class="checkbox">${isChecked ? '✓' : ''}</div>
                    <div class="muscle-text">${muscle}</div>
                `;
                
                moreExercises.appendChild(muscleItem);
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
    
    saveData();
}

function toggleMoreExercises() {
    showMore = !showMore;
    renderExercises(); // Po prostu przerenderwij wszystko
}

function toggleMuscle(muscle) {
    muscleStates[muscle] = !muscleStates[muscle];
    
    // Po prostu przerenderwij - bez auto-restartu
    renderExercises();
}

function randomizeOrder() {
    if (confirm('Czy na pewno chcesz wylosować nową listę? Obecny postęp zostanie zresetowany.')) {
        muscleOrder = shuffleArray(MUSCLES);
        // Reset checkboxów
        MUSCLES.forEach(muscle => {
            muscleStates[muscle] = false;
        });
        showMore = false;
        renderExercises();
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
        background: #000000;
        color: white;
        padding: 15px;
        text-align: center;
        z-index: 1000;
        cursor: pointer;
        font-weight: bold;
    `;
    updateBanner.innerHTML = '🔄 Dostępna aktualizacja! Kliknij aby odświeżyć';
    updateBanner.onclick = () => {
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
        randomizeOrder();
    }, 500);
}

// Inicjalizacja po załadowaniu strony
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    renderExercises();
});