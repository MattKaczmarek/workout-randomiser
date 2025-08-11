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
let totalWorkouts = 0;
let lastWorkoutDate = null;

// Funkcje localStorage
function saveData() {
    const data = {
        muscleStates: muscleStates,
        muscleOrder: muscleOrder,
        totalWorkouts: totalWorkouts,
        lastWorkoutDate: lastWorkoutDate
    };
    localStorage.setItem('workoutRandomiser', JSON.stringify(data));
}

function loadData() {
    const saved = localStorage.getItem('workoutRandomiser');
    if (saved) {
        const data = JSON.parse(saved);
        muscleStates = data.muscleStates || {};
        muscleOrder = data.muscleOrder || [...MUSCLES];
        totalWorkouts = data.totalWorkouts || 0;
        lastWorkoutDate = data.lastWorkoutDate || null;
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
        totalWorkouts = 0;
        lastWorkoutDate = null;
        
        MUSCLES.forEach(muscle => {
            muscleStates[muscle] = false;
        });
        
        renderMuscles();
        updateStats();
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

function renderMuscles() {
    const muscleList = document.getElementById('muscleList');
    muscleList.innerHTML = '';
    
    muscleOrder.forEach((muscle, index) => {
        const isChecked = muscleStates[muscle];
        const muscleItem = document.createElement('div');
        muscleItem.className = `muscle-item ${isChecked ? 'checked' : ''}`;
        muscleItem.onclick = () => toggleMuscle(muscle);
        
        muscleItem.innerHTML = `
            <div class="checkbox">${isChecked ? '✓' : ''}</div>
            <div class="muscle-text">${index + 1}. ${muscle}</div>
        `;
        
        muscleList.appendChild(muscleItem);
    });
    
    saveData();
}

function toggleMuscle(muscle) {
    muscleStates[muscle] = !muscleStates[muscle];
    
    // Sprawdź czy wszystkie są odznaczone
    const allChecked = Object.values(muscleStates).every(checked => checked);
    
    if (allChecked) {
        // Zwiększ liczbę treningów
        totalWorkouts++;
        lastWorkoutDate = new Date().toLocaleDateString('pl-PL');
        
        // Pokaż komunikat
        const notice = document.getElementById('resetNotice');
        notice.classList.add('show');
        
        // Reset po 2 sekundach
        setTimeout(() => {
            MUSCLES.forEach(m => {
                muscleStates[m] = false;
            });
            notice.classList.remove('show');
            renderMuscles();
            updateStats();
        }, 2000);
    }
    
    renderMuscles();
    updateStats();
}

function randomizeOrder() {
    muscleOrder = shuffleArray(MUSCLES);
    // Reset checkboxów
    MUSCLES.forEach(muscle => {
        muscleStates[muscle] = false;
    });
    renderMuscles();
    updateStats();
}

function updateStats() {
    const statsElement = document.getElementById('stats');
    const completedCount = Object.values(muscleStates).filter(state => state).length;
    const totalCount = MUSCLES.length;
    
    statsElement.innerHTML = `
        <h3>📊 Statystyki</h3>
        <div class="stats-info">
            Wykonane dziś: ${completedCount}/${totalCount}<br>
            Ukończone treningi: ${totalWorkouts}<br>
            ${lastWorkoutDate ? `Ostatni trening: ${lastWorkoutDate}` : 'Brak ukończonych treningów'}
        </div>
    `;
    
    saveData();
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
        background: #28a745;
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
    renderMuscles();
    updateStats();
});