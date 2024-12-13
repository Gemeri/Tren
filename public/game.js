const socket = io();

const mainMenu = document.getElementById('main-menu');
const playButton = document.getElementById('play-button');
const loadButton = document.getElementById('load-button');
const gameScreen = document.getElementById('game-screen');
const gameCanvas = document.getElementById('game-canvas');
const ctx = gameCanvas.getContext('2d');

const buildTrackButton = document.getElementById('build-track-button');
const buyTrainButton = document.getElementById('buy-train-button');
const upgradeTrackButton = document.getElementById('upgrade-track-button');
const bribeStateButton = document.getElementById('bribe-state-button');
const takeLoanButton = document.getElementById('take-loan-button');
const payLoanButton = document.getElementById('pay-loan-button');
const saveGameButton = document.getElementById('save-game-button');

const workersPaySlider = document.getElementById('workers-pay-slider');
const workersPayValue = document.getElementById('workers-pay-value');
const politicalAffiliationSelect = document.getElementById('political-affiliation');

const moneyDisplay = document.getElementById('money');
const workersPayDisplay = document.getElementById('workers-pay');
const taxRateDisplay = document.getElementById('tax-rate');
const politicalAffiliationDisplay = document.getElementById('political-affiliation-display');
const rulingPartyDisplay = document.getElementById('ruling-party');

const tracksList = document.getElementById('tracks-list');
const trainsList = document.getElementById('trains-list');
const loansList = document.getElementById('loans-list');

const loadSaveFileInput = document.getElementById('load-save-file');
const loadSaveButton = document.getElementById('load-save-button');

const popupModal = document.getElementById('popup-modal');
const popupMessage = document.getElementById('popup-message');
const popupInputContainer = document.getElementById('popup-input-container');
const popupOkButton = document.getElementById('popup-ok-button');

const pauseOverlay = document.getElementById('pause-overlay');

console.log('Popup Elements:', {
  popupModal,
  popupMessage,
  popupInputContainer,
  popupOkButton
});

const trainImage = new Image();
trainImage.src = 'assets/images/train.png';
trainImage.onload = () => {
  console.log('Train image loaded.');
};

let gameState = {
  money: 100000,
  tracks: [],
  trains: [],
  workersPayPercentage: 50,
  taxRate: 20,
  politicalAffiliation: 'neutral',
  country: { states: [] },
  selectedCities: [],
  loan: null,
  electionInterval: null,
  financialCycleInterval: null,
  loanCheckInterval: null,
  disruptionActive: false,
  buildingTrack: false,
  hoveredCity: null,

  protestProbabilityFactor: 1,
  maintenanceCostFactor: 1,

  finance: {
    gains: [],
    losses: [],
    totalGain: 0,
    totalLoss: 0,
    netChange: 0,
  },

  affiliationChangeCost: 100000,

  gamePaused: false,
  popupActive: false,

  gameStarted: false,

  activeTrainAnimations: [],

  lastFrameTime: null,
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function calculateDistance(cityA, cityB) {
  const dx = cityA.x - cityB.x;
  const dy = cityA.y - cityB.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function generateCountry() {
  const numberOfStates = 9;
  const gridRows = 3;
  const gridCols = 3;
  const stateWidth = gameCanvas.clientWidth / gridCols;
  const stateHeight = gameCanvas.clientHeight / gridRows;
  const states = [];

  let stateCount = 0;
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      if (stateCount >= numberOfStates) break;

      const stateId = stateCount;
      const stateName = `State ${stateId + 1}`;
      const hasPrimitiveTrait = Math.random() < 0.2;

      const xStart = col * stateWidth;
      const yStart = row * stateHeight;
      const xEnd = xStart + stateWidth;
      const yEnd = yStart + stateHeight;

      const numberOfCities = getRandomInt(3, 7);
      const cities = [];
      for (let i = 0; i < numberOfCities; i++) {
        let cityX, cityY;
        let isValidPosition = false;
        const minDistance = 30;

        while (!isValidPosition) {
          cityX = getRandomInt(xStart + 30, xEnd - 30);
          cityY = getRandomInt(yStart + 30, yEnd - 30);

          isValidPosition = true;
          for (const existingCity of cities) {
            const distance = Math.hypot(existingCity.x - cityX, existingCity.y - cityY);
            if (distance < minDistance) {
              isValidPosition = false;
              break;
            }
          }

          for (const state of states) {
            for (const existingCity of state.cities) {
              const distance = Math.hypot(existingCity.x - cityX, existingCity.y - cityY);
              if (distance < minDistance) {
                isValidPosition = false;
                break;
              }
            }
            if (!isValidPosition) break;
          }
        }

        cities.push({
          id: `${stateId}-${i}-${Date.now()}-${Math.random()}`,
          name: `City ${stateId + 1}-${i + 1}`,
          x: cityX,
          y: cityY,
          radius: 15,
        });
      }

      states.push({
        id: stateId,
        name: stateName,
        cities: cities,
        hasPrimitiveTrait: hasPrimitiveTrait,
        party: 'neutral',
        bribed: false,
        boundaries: { xStart, yStart, xEnd, yEnd },
      });

      stateCount++;
    }
  }

  gameState.country = {
    name: 'Railtopia',
    states: states,
  };

  console.log('Country Generated:', gameState.country);
}

function initializeGame() {
  generateCountry();
  conductElection();
  gameState.gameStarted = true;
  renderGame();
  startFinancialCycle();
  startLoanCheckCycle();
  startElectionCycle();
  startTrainAnimations();
}

function renderGame() {
  if (gameState.gameStarted && (!gameState.country || !Array.isArray(gameState.country.states))) {
    console.error('Game State Error: country.states is undefined.');
    showPopup({
      message: 'Game data is corrupted. Please start a new game.',
      type: 'alert',
      callback: () => {
        endGame();
      }
    });
    return;
  }

  ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

  gameState.country.states.forEach(state => {
    ctx.beginPath();
    ctx.rect(
      state.boundaries.xStart,
      state.boundaries.yStart,
      state.boundaries.xEnd - state.boundaries.xStart,
      state.boundaries.yEnd - state.boundaries.yStart
    );

    if (state.hasPrimitiveTrait) {
      ctx.fillStyle = '#D3D3D3';
    } else if (state.party === 'red') {
      ctx.fillStyle = '#FF7F7F';
    } else if (state.party === 'blue') {
      ctx.fillStyle = '#7F7FFF';
    } else {
      ctx.fillStyle = '#90EE90';
    }

    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'black';
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.font = '16px Comic Sans MS';
    const centerX = (state.boundaries.xStart + state.boundaries.xEnd) / 2;
    const centerY = (state.boundaries.yStart + state.boundaries.yEnd) / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.name, centerX, centerY);
  });

  gameState.tracks.forEach((track, index) => {
    const cityA = getCityById(track.cityA);
    const cityB = getCityById(track.cityB);
    if (cityA && cityB) {
      ctx.beginPath();
      ctx.moveTo(cityA.x, cityA.y);
      ctx.lineTo(cityB.x, cityB.y);
      ctx.strokeStyle = '#8b4513';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  });

  gameState.country.states.forEach(state => {
    state.cities.forEach(city => {
      ctx.beginPath();
      ctx.arc(city.x, city.y, city.radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#4682b4';
      ctx.fill();
      ctx.strokeStyle = 'black';
      ctx.stroke();

      if (gameState.selectedCities.includes(city.id)) {
        ctx.beginPath();
        ctx.arc(city.x, city.y, city.radius + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      if (gameState.hoveredCity && gameState.hoveredCity.id === city.id) {
        ctx.beginPath();
        ctx.arc(city.x, city.y, city.radius + 5, 0, 2 * Math.PI);
        ctx.strokeStyle = 'orange';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.fillStyle = '#000000';
      ctx.font = '12px Comic Sans MS';
      ctx.fillText(city.name, city.x + 12, city.y + 4);
    });
  });

  gameState.activeTrainAnimations.forEach(animation => {
    drawTrainAnimation(animation);
  });

  updateInfoPanel();
}

function updateInfoPanel() {
  moneyDisplay.textContent = gameState.money.toLocaleString();
  workersPayDisplay.textContent = `${gameState.workersPayPercentage}%`;
  taxRateDisplay.textContent = `${gameState.taxRate}%`;
  politicalAffiliationDisplay.textContent = capitalizeFirstLetter(gameState.politicalAffiliation);

  const redStates = gameState.country.states.filter(state => state.party === 'red').length;
  const blueStates = gameState.country.states.filter(state => state.party === 'blue').length;
  let rulingParty = 'Neutral';
  if (redStates > blueStates) {
    rulingParty = 'Red Party';
  } else if (blueStates > redStates) {
    rulingParty = 'Blue Party';
  }
  rulingPartyDisplay.textContent = rulingParty;

  tracksList.innerHTML = '';
  gameState.tracks.forEach((track, index) => {
    const li = document.createElement('li');
    const cityA = getCityById(track.cityA);
    const cityB = getCityById(track.cityB);
    li.textContent = `Track ${index + 1}: ${cityA.name} ↔ ${cityB.name} | Level: ${track.level}`;
    tracksList.appendChild(li);
  });

  trainsList.innerHTML = '';
  gameState.trains.forEach((train, index) => {
    const li = document.createElement('li');
    li.textContent = `Train ${index + 1}: ${capitalizeFirstLetter(train.type)} | Speed: ${train.speed} | Revenue: $${train.baseRevenue}`;
    trainsList.appendChild(li);
  });

  loansList.innerHTML = '';
  if (gameState.loan) {
    const li = document.createElement('li');
    const remainingMinutes = Math.floor(gameState.loan.remainingTime / 60000);
    const remainingSeconds = Math.floor((gameState.loan.remainingTime % 60000) / 1000);
    li.textContent = `Loan: $${gameState.loan.amount.toLocaleString()} | Repayment: $${gameState.loan.repaymentAmount.toLocaleString()} | Time Left: ${remainingMinutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    loansList.appendChild(li);
  }

  updateFinancePanel();
}

function updateFinancePanel() {
  const financeDetails = document.getElementById('finance-details');
  if (!financeDetails) return;

  financeDetails.innerHTML = '';

  const gainsHeader = document.createElement('h4');
  gainsHeader.textContent = 'Gains';
  financeDetails.appendChild(gainsHeader);

  if (gameState.finance.gains.length === 0) {
    const noGains = document.createElement('p');
    noGains.textContent = 'No gains this cycle.';
    financeDetails.appendChild(noGains);
  } else {
    const gainsList = document.createElement('ul');
    gameState.finance.gains.forEach(gain => {
      const li = document.createElement('li');
      li.textContent = `${gain.description}: +$${gain.amount.toLocaleString()}`;
      li.style.color = 'green';
      gainsList.appendChild(li);
    });
    financeDetails.appendChild(gainsList);
  }

  const lossesHeader = document.createElement('h4');
  lossesHeader.textContent = 'Losses';
  financeDetails.appendChild(lossesHeader);

  if (gameState.finance.losses.length === 0) {
    const noLosses = document.createElement('p');
    noLosses.textContent = 'No losses this cycle.';
    financeDetails.appendChild(noLosses);
  } else {
    const lossesList = document.createElement('ul');
    gameState.finance.losses.forEach(loss => {
      const li = document.createElement('li');
      li.textContent = `${loss.description}: -$${loss.amount.toLocaleString()}`;
      li.style.color = 'red';
      lossesList.appendChild(li);
    });
    financeDetails.appendChild(lossesList);
  }

  const totalSection = document.createElement('div');
  totalSection.style.marginTop = '10px';

  const totalGain = document.createElement('p');
  totalGain.textContent = `Total Gains: +$${gameState.finance.totalGain.toLocaleString()}`;
  totalSection.appendChild(totalGain);

  const totalLoss = document.createElement('p');
  totalLoss.textContent = `Total Losses: -$${gameState.finance.totalLoss.toLocaleString()}`;
  totalSection.appendChild(totalLoss);

  const netChange = document.createElement('p');
  netChange.textContent = `Net Change: ${gameState.finance.netChange >= 0 ? '+' : '-'}$${Math.abs(gameState.finance.netChange).toLocaleString()}`;
  netChange.style.fontWeight = 'bold';
  netChange.style.color = gameState.finance.netChange >= 0 ? 'green' : 'red';
  totalSection.appendChild(netChange);

  financeDetails.appendChild(totalSection);
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getCityById(id) {
  for (const state of gameState.country.states) {
    for (const city of state.cities) {
      if (city.id === id) return city;
    }
  }
  return null;
}

function getStateByCityId(cityId) {
  for (const state of gameState.country.states) {
    for (const city of state.cities) {
      if (city.id === cityId) return state;
    }
  }
  return null;
}

function isCityConnected(cityId) {
  return gameState.tracks.some(track => track.cityA === cityId || track.cityB === cityId);
}

playButton.addEventListener('click', startNewGame);
loadButton.addEventListener('click', () => {
  loadSaveFileInput.click();
});
loadSaveButton.addEventListener('click', () => {
  loadSaveFileInput.click();
});
loadSaveFileInput.addEventListener('change', handleFileUpload);

buildTrackButton.addEventListener('click', () => {
  if (gameState.disruptionActive) {
    showPopup({
      message: 'Cannot build tracks during a disruption.',
      type: 'alert'
    });
    return;
  }
  gameState.buildingTrack = true;
  gameState.selectedCities = [];
  gameCanvas.style.cursor = 'pointer';
  showPopup({
    message: 'Select two cities on the map to build a track.',
    type: 'alert'
  });
});
buyTrainButton.addEventListener('click', buyTrainPrompt);
upgradeTrackButton.addEventListener('click', upgradeTrack);
bribeStateButton.addEventListener('click', bribeStatePrompt);
takeLoanButton.addEventListener('click', takeLoanPrompt);
payLoanButton.addEventListener('click', payLoanEarly);
saveGameButton.addEventListener('click', saveGame);

workersPaySlider.addEventListener('input', () => {
  workersPayValue.textContent = `${workersPaySlider.value}%`;
  gameState.workersPayPercentage = parseInt(workersPaySlider.value);
  applyWorkersPayEffects();
});

politicalAffiliationSelect.addEventListener('change', () => {
  const newAffiliation = politicalAffiliationSelect.value;
  const currentAffiliation = gameState.politicalAffiliation;

  if (currentAffiliation !== newAffiliation) {
    if (
      (currentAffiliation === 'neutral' && (newAffiliation === 'red' || newAffiliation === 'blue')) ||
      ((currentAffiliation === 'red' || currentAffiliation === 'blue') && (newAffiliation === 'neutral'))
    ) {
      if (gameState.money >= gameState.affiliationChangeCost) {
        gameState.money -= gameState.affiliationChangeCost;

        gameState.finance.losses.push({
          description: `Changing political affiliation to ${capitalizeFirstLetter(newAffiliation)}`,
          amount: gameState.affiliationChangeCost,
        });
        gameState.finance.totalLoss += gameState.affiliationChangeCost;
        gameState.finance.netChange -= gameState.affiliationChangeCost;

        showPopup({
          message: `Changed political affiliation to ${capitalizeFirstLetter(newAffiliation)}. Cost: $${gameState.affiliationChangeCost.toLocaleString()}`,
          type: 'alert'
        });
      } else {
        showPopup({
          message: 'Not enough money to change political affiliation.',
          type: 'alert'
        });
        politicalAffiliationSelect.value = currentAffiliation;
        return;
      }
    }
  }

  gameState.politicalAffiliation = newAffiliation;

  applyPoliticalAffiliationEffects();

  renderGame();
});

function startNewGame() {
  mainMenu.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  initializeGame();
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  loadGameFromFile(file);
}

function loadGameFromFile(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.country || !Array.isArray(data.country.states)) {
        throw new Error('Invalid game data.');
      }
      if (data.loan && typeof data.loan.remainingTime !== 'number') {
        throw new Error('Invalid loan data.');
      }

      gameState = data;

      if (gameState.activeTrainAnimations && Array.isArray(gameState.activeTrainAnimations)) {
        gameState.activeTrainAnimations.forEach(animation => {
          animation.image = trainImage;
        });
      }

      clearInterval(gameState.financialCycleInterval);
      clearInterval(gameState.loanCheckInterval);
      clearInterval(gameState.electionInterval);
      
      startFinancialCycle();
      startLoanCheckCycle();
      startElectionCycle();
      startTrainAnimations();

      gameState.gameStarted = true;

      mainMenu.classList.add('hidden');
      gameScreen.classList.remove('hidden');
      renderGame();
      showPopup({
        message: 'Game loaded successfully!',
        type: 'alert'
      });
    } catch (err) {
      console.error('Error parsing save file:', err);
      showPopup({
        message: 'Failed to load save file. Please ensure it is a valid JSON file.',
        type: 'alert'
      });
    }
  };
  reader.readAsText(file);
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;

  const rect = gameCanvas.getBoundingClientRect();

  ctx.setTransform(1, 0, 0, 1, 0, 0);

  gameCanvas.width = rect.width * dpr;
  gameCanvas.height = rect.height * dpr;

  ctx.scale(dpr, dpr);

  renderGame();
}

window.addEventListener('load', () => {
  resizeCanvas();
});

window.addEventListener('resize', () => {
  resizeCanvas();
});

gameCanvas.addEventListener('click', (event) => {
  if (!gameState.buildingTrack) return;

  const rect = gameCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const x = (event.clientX - rect.left) * dpr;
  const y = (event.clientY - rect.top) * dpr;
  console.log(`Canvas clicked at (${x.toFixed(2)}, ${y.toFixed(2)})`);

  const clickedCity = findCityAtCoordinates(x, y);

  if (clickedCity) {
    console.log(`City selected: ${clickedCity.name}`);
    toggleCitySelection(clickedCity);
  } else {
    console.log('Clicked outside any city.');
  }

  renderGame();
});

gameCanvas.addEventListener('mousemove', (event) => {
  if (gameState.gamePaused || gameState.popupActive) return;

  const rect = gameCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const x = (event.clientX - rect.left) * dpr;
  const y = (event.clientY - rect.top) * dpr;

  const hoveredCity = findCityAtCoordinates(x, y);
  if (hoveredCity) {
    if (gameState.hoveredCity !== hoveredCity) {
      gameState.hoveredCity = hoveredCity;
      gameCanvas.style.cursor = 'pointer';
      renderGame();
    }
  } else {
    if (gameState.hoveredCity !== null) {
      gameState.hoveredCity = null;
      gameCanvas.style.cursor = gameState.buildingTrack ? 'pointer' : 'crosshair';
      renderGame();
    }
  }
});

function findCityAtCoordinates(x, y) {
  let closestCity = null;
  let minDistance = Infinity;

  for (const state of gameState.country.states) {
    for (const city of state.cities) {
      const distance = Math.hypot(city.x - x, city.y - y);
      if (distance <= city.radius && distance < minDistance) {
        minDistance = distance;
        closestCity = city;
      }
    }
  }

  return closestCity;
}

function toggleCitySelection(city) {
  if (gameState.selectedCities.includes(city.id)) {
    gameState.selectedCities = gameState.selectedCities.filter(id => id !== city.id);
    console.log(`Deselected city: ${city.name}`);
  } else {
    if (gameState.selectedCities.length < 2) {
      gameState.selectedCities.push(city.id);
      console.log(`Selected city: ${city.name}`);
    } else {
      showPopup({
        message: 'You have already selected two cities. Please build the track or deselect a city.',
        type: 'alert'
      });
      return;
    }
  }

  renderGame();

  if (gameState.selectedCities.length === 2) {
    const [cityAId, cityBId] = gameState.selectedCities;
    buildTrack(cityAId, cityBId);
    gameState.selectedCities = [];
    gameCanvas.style.cursor = 'crosshair';
  }
}

function buildTrack(cityAId, cityBId) {
  const cityA = getCityById(cityAId);
  const cityB = getCityById(cityBId);
  if (!cityA || !cityB) {
    showPopup({
      message: 'Invalid cities selected.',
      type: 'alert'
    });
    return;
  }

  const stateA = getStateByCityId(cityAId);
  const stateB = getStateByCityId(cityBId);
  if (stateA.hasPrimitiveTrait || stateB.hasPrimitiveTrait) {
    showPopup({
      message: 'Cannot build tracks in states with primitive traits.',
      type: 'alert'
    });
    return;
  }

  const exists = gameState.tracks.some(track =>
    (track.cityA === cityAId && track.cityB === cityBId) ||
    (track.cityA === cityBId && track.cityB === cityAId)
  );

  if (exists) {
    showPopup({
      message: 'Track already exists between these cities.',
      type: 'alert'
    });
    return;
  }

  if (gameState.tracks.length > 0) {
    const cityAConnected = isCityConnected(cityAId);
    const cityBConnected = isCityConnected(cityBId);
    if (!cityAConnected && !cityBConnected) {
      showPopup({
        message: 'At least one of the cities must be connected to an existing track.',
        type: 'alert'
      });
      return;
    }
  }

  const distance = calculateDistance(cityA, cityB);
  const cost = distance * 100;
  const totalCost = cost * (1 + gameState.taxRate / 100);

  if (gameState.money >= totalCost) {
    gameState.money -= totalCost;

    gameState.finance.losses.push({
      description: `Building track between ${cityA.name} and ${cityB.name}`,
      amount: totalCost,
    });
    gameState.finance.totalLoss += totalCost;
    gameState.finance.netChange -= totalCost;

    gameState.tracks.push({
      cityA: cityAId,
      cityB: cityBId,
      length: distance,
      maintenanceCost: (distance * 1) / 2,
      level: 1,
    });
    
    showPopup({
      message: `Track built between ${cityA.name} and ${cityB.name}.`,
      type: 'alert'
    });
    renderGame();
  } else {
    showPopup({
      message: 'Not enough money to build this track.',
      type: 'alert'
    });
  }
}

function buyTrainPrompt() {
  showPopup({
    message: 'Choose train type:',
    type: 'confirm',
    buttons: [
      {
        label: 'Slow',
        onClick: () => buyTrain('slow')
      },
      {
        label: 'Fast',
        onClick: () => buyTrain('fast')
      }
    ]
  });
}

function buyTrain(type) {
  const trainTypes = {
    slow: { speed: 30, cost: 5000, maintenanceCost: 100, baseRevenue: 500 },
    fast: { speed: 60, cost: 15000, maintenanceCost: 300, baseRevenue: 1500 },
  };

  const train = trainTypes[type];
  if (!train) {
    showPopup({
      message: 'Invalid train type.',
      type: 'alert'
    });
    return;
  }

  const totalCost = train.cost * (1 + gameState.taxRate / 100);
  if (gameState.money >= totalCost) {
    gameState.money -= totalCost;

    gameState.finance.losses.push({
      description: `Purchasing ${capitalizeFirstLetter(type)} train`,
      amount: totalCost,
    });
    gameState.finance.totalLoss += totalCost;
    gameState.finance.netChange -= totalCost;

    gameState.trains.push({
      id: `${Date.now()}-${Math.random()}`,
      type: type,
      speed: train.speed,
      maintenanceCost: train.maintenanceCost,
      baseRevenue: train.baseRevenue,
      status: 'active',
    });
    showPopup({
      message: `${capitalizeFirstLetter(type)} train purchased.`,
      type: 'alert'
    });
    renderGame();
  } else {
    showPopup({
      message: 'Not enough money to buy this train.',
      type: 'alert'
    });
  }
}

function upgradeTrack() {
  if (gameState.tracks.length === 0) {
    showPopup({
      message: 'No tracks to upgrade.',
      type: 'alert'
    });
    return;
  }

  showPopup({
    message: `Enter track number to upgrade (1-${gameState.tracks.length}):`,
    type: 'input',
    callback: (inputValue) => {
      const trackNumber = parseInt(inputValue);
      if (isNaN(trackNumber) || trackNumber < 1 || trackNumber > gameState.tracks.length) {
        showPopup({
          message: 'Invalid track number.',
          type: 'alert'
        });
        return;
      }
      upgradeTrackNumber(trackNumber);
    }
  });
}

function upgradeTrackNumber(trackNumber) {
  const track = gameState.tracks[trackNumber - 1];
  const upgradeCost = track.length * 200 * track.level;
  const totalUpgradeCost = upgradeCost * (1 + gameState.taxRate / 100);

  if (gameState.money >= totalUpgradeCost) {
    gameState.money -= totalUpgradeCost;

    gameState.finance.losses.push({
      description: `Upgrading track ${trackNumber}`,
      amount: totalUpgradeCost,
    });
    gameState.finance.totalLoss += totalUpgradeCost;
    gameState.finance.netChange -= totalUpgradeCost;

    track.level += 1;
    track.maintenanceCost += (track.length * 1) / 2;
    showPopup({
      message: `Track ${trackNumber} upgraded to level ${track.level}.`,
      type: 'alert'
    });
    renderGame();
  } else {
    showPopup({
      message: 'Not enough money to upgrade this track.',
      type: 'alert'
    });
  }
}

function bribeStatePrompt() {
  const stateNames = gameState.country.states
    .filter(state => state.hasPrimitiveTrait)
    .map(state => state.name)
    .join(', ');
  
  if (!stateNames) {
    showPopup({
      message: 'No states with primitive traits available for bribery.',
      type: 'alert'
    });
    return;
  }

  showPopup({
    message: `Enter the name of the state to bribe (${stateNames}):`,
    type: 'input',
    callback: (stateName) => {
      if (!stateName) {
        showPopup({
          message: 'No state name entered.',
          type: 'alert'
        });
        return;
      }
      const state = gameState.country.states.find(s => s.name.toLowerCase() === stateName.toLowerCase());

      if (!state) {
        showPopup({
          message: 'Invalid state name.',
          type: 'alert'
        });
        return;
      }

      if (!state.hasPrimitiveTrait) {
        showPopup({
          message: 'This state does not have a primitive trait to bribe.',
          type: 'alert'
        });
        return;
      }

      bribeState(state.id);
    }
  });
}

function bribeState(stateId) {
  const state = gameState.country.states.find(s => s.id === stateId);
  if (!state) {
    showPopup({
      message: 'State not found.',
      type: 'alert'
    });
    return;
  }

  const bribeAmount = 10000;
  const totalBribe = bribeAmount * (1 + gameState.taxRate / 100);

  if (gameState.money >= totalBribe) {
    const caught = Math.random() < 0.3;
    if (caught) {
      gameState.money -= totalBribe;

      gameState.finance.losses.push({
        description: `Bribing state ${state.name} (Caught)`,
        amount: totalBribe,
      });
      gameState.finance.totalLoss += totalBribe;
      gameState.finance.netChange -= totalBribe;

      state.hasPrimitiveTrait = true;
      showPopup({
        message: 'You got caught bribing! Primitive trait remains and you are fined.',
        type: 'alert'
      });
      gameState.taxRate += 10;

      gameState.finance.losses.push({
        description: `Tax Rate Increased by 10% Due to Bribery Consequence`,
        amount: 0,
      });
    } else {
      gameState.money -= totalBribe;

      gameState.finance.losses.push({
        description: `Bribing state ${state.name} (Successful)`,
        amount: totalBribe,
      });
      gameState.finance.totalLoss += totalBribe;
      gameState.finance.netChange -= totalBribe;

      state.hasPrimitiveTrait = false;
      state.bribed = true; 
      showPopup({
        message: 'Bribe successful! You can now build in this state.',
        type: 'alert'
      });
    }
    renderGame();
  } else {
    showPopup({
      message: 'Not enough money to bribe.',
      type: 'alert'
    });
  }
}

function takeLoanPrompt() {
  if (gameState.loan) {
    showPopup({
      message: 'You already have a loan.',
      type: 'alert'
    });
    return;
  }

  showPopup({
    message: 'Enter loan amount:',
    type: 'input',
    callback: (amountStr) => {
      const amount = parseInt(amountStr);
      if (isNaN(amount) || amount <= 0) {
        showPopup({
          message: 'Invalid loan amount.',
          type: 'alert'
        });
        return;
      }

      takeLoan(amount);
    }
  });
}

function takeLoan(amount) {
  const taxRateAtLoan = gameState.taxRate;
  const interestRate = taxRateAtLoan / 4;
  const repaymentAmount = Math.round(amount * (1 + (interestRate / 100)));

  gameState.money += amount;
  gameState.loan = {
    amount: amount,
    repaymentAmount: repaymentAmount,
    remainingTime: 10 * 60 * 1000,
    interestRate: interestRate,
  };

  showPopup({
    message: `Loan of $${amount.toLocaleString()} taken. You will need to repay $${repaymentAmount.toLocaleString()} in 10 minutes.`,
    type: 'alert'
  });

  gameState.finance.gains.push({
    description: `Loan Taken`,
    amount: amount,
  });
  gameState.finance.totalGain += amount;
  gameState.finance.netChange += amount;

  renderGame();
}

function payLoanEarly() {
  if (!gameState.loan) {
    showPopup({
      message: 'You have no loan to repay.',
      type: 'alert'
    });
    return;
  }

  const repaymentAmount = gameState.loan.repaymentAmount;
  if (gameState.money >= repaymentAmount) {
    gameState.money -= repaymentAmount;
    showPopup({
      message: 'Loan repaid successfully.',
      type: 'alert'
    });

    gameState.finance.losses.push({
      description: `Loan Repayment`,
      amount: repaymentAmount,
    });
    gameState.finance.totalLoss += repaymentAmount;
    gameState.finance.netChange -= repaymentAmount;

    gameState.loan = null;
    renderGame();
  } else {
    showPopup({
      message: 'Not enough money to repay the loan.',
      type: 'alert'
    });
  }
}

function repayLoan() {
  if (!gameState.loan) return;

  const repaymentAmount = gameState.loan.repaymentAmount;
  if (gameState.money >= repaymentAmount) {
    gameState.money -= repaymentAmount;
    showPopup({
      message: 'Loan repaid successfully.',
      type: 'alert'
    });

    gameState.finance.losses.push({
      description: `Loan Repayment`,
      amount: repaymentAmount,
    });
    gameState.finance.totalLoss += repaymentAmount;
    gameState.finance.netChange -= repaymentAmount;

    gameState.loan = null;
  } else {
    showPopup({
      message: 'Failed to repay the loan. Game Over.',
      type: 'alert',
      callback: () => {
        endGame();
      }
    });
  }
  renderGame();
}

function checkLoanStatus() {
  if (gameState.loan) {
    if (gameState.loan.remainingTime <= 0) {
      repayLoan();
    }
  }
}

function saveGame() {
  const saveData = JSON.parse(JSON.stringify(gameState, (key, value) => {
    if (key === 'image') {
      return undefined;
    }
    return value;
  }, 2));

  const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'savegame.json';
  a.click();
  
  URL.revokeObjectURL(url);
}

function startFinancialCycle() {
  gameState.financialCycleInterval = setInterval(() => {
    if (gameState.gamePaused || gameState.popupActive) return;

    gameState.finance.gains = [];
    gameState.finance.losses = [];
    gameState.finance.totalGain = 0;
    gameState.finance.totalLoss = 0;
    gameState.finance.netChange = 0;

    const maintenanceTracks = gameState.tracks.reduce((sum, track) => sum + (track.maintenanceCost * track.level), 0);
    const maintenanceTrains = gameState.trains.reduce((sum, train) => sum + train.maintenanceCost, 0);
    let maintenanceTotal = (maintenanceTracks + maintenanceTrains);

    maintenanceTotal *= gameState.maintenanceCostFactor;

    gameState.finance.losses.push({
      description: `Maintenance Costs`,
      amount: maintenanceTotal,
    });
    gameState.finance.totalLoss += maintenanceTotal;
    gameState.finance.netChange -= maintenanceTotal;

    if (gameState.money >= maintenanceTotal) {
      gameState.money -= maintenanceTotal;
    } else {
      handleBankruptcy();
      return;
    }

    const baseLossWorkers = 1000 + (gameState.trains.length + gameState.tracks.length) * 100;
    const moneyLossWorkers = (baseLossWorkers * (gameState.workersPayPercentage / 100) / 2);

    if (gameState.money >= moneyLossWorkers) {
      gameState.money -= moneyLossWorkers;

      gameState.finance.losses.push({
        description: `Workers' Pay (${gameState.workersPayPercentage}%)`,
        amount: moneyLossWorkers,
      });
      gameState.finance.totalLoss += moneyLossWorkers;
      gameState.finance.netChange -= moneyLossWorkers;
    } else {
      handleBankruptcy();
      return;
    }

    if (gameState.workersPayPercentage < 30) {
      let probability = (30 - gameState.workersPayPercentage) / 100;
      probability *= gameState.protestProbabilityFactor;
      if (Math.random() < probability) {
        handleProtest();
      }
    }

    const totalTrackFactor = gameState.tracks.reduce((sum, track) => sum + (track.length * track.level), 0);

    let revenueTotal = 0;
    gameState.trains.forEach(train => {
      if (train.status === 'active') {
        const trainRevenue = train.baseRevenue * (totalTrackFactor / 1000);
        revenueTotal += trainRevenue;
      }
    });

    const taxAmount = revenueTotal * (gameState.taxRate / 100);
    const netRevenue = (revenueTotal - taxAmount);

    if (netRevenue > 0) {
      gameState.finance.gains.push({
        description: `Revenue from Trains`,
        amount: netRevenue,
      });
      gameState.finance.totalGain += netRevenue;
      gameState.finance.netChange += netRevenue;
    }

    if (taxAmount > 0) {
      const taxPerCycle = taxAmount;
      gameState.finance.losses.push({
        description: `Taxes on Revenue`,
        amount: taxPerCycle,
      });
      gameState.finance.totalLoss += taxPerCycle;
      gameState.finance.netChange -= taxPerCycle;

      if (gameState.money >= taxPerCycle) {
        gameState.money -= taxPerCycle;
      } else {
        handleBankruptcy();
        return;
      }
    }

    gameState.money += netRevenue;

    renderGame();
  }, 10000);
}

function startLoanCheckCycle() {
  gameState.loanCheckInterval = setInterval(() => {
    if (gameState.gamePaused || gameState.popupActive) return;

    if (gameState.loan) {
      gameState.loan.remainingTime -= 1000;

      if (gameState.loan.remainingTime <= 0) {
        repayLoan();
      }
    }
  }, 1000);
}

function startElectionCycle() {
  gameState.electionInterval = setInterval(() => {
    if (gameState.gamePaused || gameState.popupActive) return;

    conductElection();
  }, 600000);
}

function conductElection() {
  gameState.country.states.forEach(state => {
    const party = Math.random() < 0.5 ? 'red' : 'blue';
    state.party = party;

    if (Math.random() < 0.1 && !state.bribed) {
      state.hasPrimitiveTrait = true;
    } else {
      state.hasPrimitiveTrait = false;
    }
  });

  applyPoliticalEffects();
  renderGame();
  showPopup({
    message: 'An election has occurred! Political landscape has changed.',
    type: 'alert'
  });
}

function applyPoliticalEffects() {
  const redStates = gameState.country.states.filter(state => state.party === 'red').length;
  const blueStates = gameState.country.states.filter(state => state.party === 'blue').length;

  if (redStates > blueStates) {
    gameState.taxRate = 10;

    gameState.protestProbabilityFactor = 0.5;
    gameState.maintenanceCostFactor = 1.2;
  } else if (blueStates > redStates) {
    gameState.taxRate = 30;

    gameState.protestProbabilityFactor = 1.5;
    gameState.maintenanceCostFactor = 0.8;
  } else {
    gameState.taxRate = 20;

    gameState.protestProbabilityFactor = 1;
    gameState.maintenanceCostFactor = 1;
  }

  renderGame();
}

function applyWorkersPayEffects() {
  renderGame();
}

function applyPoliticalAffiliationEffects() {
  const rulingParty = getRulingParty();

  if (gameState.politicalAffiliation === 'red') {
    if (rulingParty === 'red') {
      gameState.taxRate = 5;

      gameState.protestProbabilityFactor = 0.3;
      gameState.maintenanceCostFactor = 1.3;

    } else if (rulingParty === 'blue') {
      gameState.taxRate = 40;

      gameState.protestProbabilityFactor = 2;
      gameState.maintenanceCostFactor = 0.6;
    }
  } else if (gameState.politicalAffiliation === 'blue') {
    if (rulingParty === 'blue') {
      gameState.taxRate = 20;

      gameState.protestProbabilityFactor = 1.2;
      gameState.maintenanceCostFactor = 0.9;

    } else if (rulingParty === 'red') {
      gameState.taxRate = 30;

      gameState.protestProbabilityFactor = 1;
      gameState.maintenanceCostFactor = 1;
    }
  } else {
    applyPoliticalEffects();
  }

  renderGame();
}

function getRulingParty() {
  const redStates = gameState.country.states.filter(state => state.party === 'red').length;
  const blueStates = gameState.country.states.filter(state => state.party === 'blue').length;
  if (redStates > blueStates) return 'red';
  if (blueStates > redStates) return 'blue';
  return 'neutral';
}

function handleBankruptcy() {
  showPopup({
    message: 'Your company has gone bankrupt!',
    type: 'alert',
    callback: () => {
      endGame();
    }
  });
}

function endGame() {
  clearInterval(gameState.electionInterval);
  clearInterval(gameState.financialCycleInterval);
  clearInterval(gameState.loanCheckInterval);
  showPopup({
    message: 'Game Over! You have lost your company.',
    type: 'alert',
    callback: () => {
      window.location.reload();
    }
  });
}

function handleDisruption() {
  gameState.disruptionActive = true;
  gameState.trains.forEach(train => {
    train.status = 'broken';
  });
  showPopup({
    message: 'Disruption occurred! Trains are temporarily inactive.',
    type: 'alert'
  });

  gameState.finance.losses.push({
    description: `Disruption: Trains Inactive`,
    amount: 0,
  });

  setTimeout(() => {
    gameState.disruptionActive = false;
    gameState.trains.forEach(train => {
      train.status = 'active';
    });
    showPopup({
      message: 'Disruptions resolved. Trains are active again.',
      type: 'alert'
    });
    renderGame();
  }, gameState.disruptionDuration || 30000);
}

function handleProtest() {
  const protestPenalty = 5000;
  if (gameState.money >= protestPenalty) {
    gameState.money -= protestPenalty;

    gameState.finance.losses.push({
      description: `Protest/Strike Occurred`,
      amount: protestPenalty,
    });
    gameState.finance.totalLoss += protestPenalty;
    gameState.finance.netChange -= protestPenalty;

    showPopup({
      message: 'A protest has occurred! Your company has been fined.',
      type: 'alert'
    });
  } else {
    handleBankruptcy();
  }
}

function showPopup(options) {
  console.log('showPopup called with options:', options);

  if (typeof options !== 'object' || options === null) {
    console.error('showPopup Error: options is not a valid object.');
    return;
  }

  if (!options.message) {
    console.warn('showPopup Warning: No message provided.');
  }

  gameState.gamePaused = true;
  gameState.popupActive = true;

  popupMessage.textContent = options.message || '';

  popupInputContainer.innerHTML = '';
  popupOkButton.style.display = 'none';

  if (options.type === 'alert') {
    popupOkButton.style.display = 'block';
    popupOkButton.onclick = () => {
      console.log('OK button clicked');
      hidePopup();
      if (options.callback) options.callback();
    };
  } else if (options.type === 'confirm') {
    options.buttons.forEach(button => {
      const btn = document.createElement('button');
      btn.textContent = button.label;
      btn.onclick = () => {
        console.log(`Confirm button clicked: ${button.label}`);
        hidePopup();
        if (button.onClick) button.onClick();
      };
      popupInputContainer.appendChild(btn);
    });
  } else if (options.type === 'input') {
    const input = document.createElement('input');
    input.type = 'text';
    popupInputContainer.appendChild(input);

    input.focus();

    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        console.log('Input submitted:', input.value);
        hidePopup();
        if (options.callback) options.callback(input.value);
      }
    };
    popupOkButton.style.display = 'block';
    popupOkButton.onclick = () => {
      const inputValue = popupInputContainer.querySelector('input').value;
      console.log('OK button clicked with input:', inputValue);
      hidePopup();
      if (options.callback) options.callback(inputValue);
    };
  }
  popupModal.classList.remove('hidden');
}

function hidePopup() {
  console.log('hidePopup called');
  gameState.popupActive = false;
  popupModal.classList.add('hidden');

  if (!pauseOverlay.classList.contains('hidden')) {
    gameState.gamePaused = true;
  } else {
    gameState.gamePaused = false;
  }
}

function clearPopup() {
  popupModal.classList.add('hidden');
  popupInputContainer.innerHTML = '';
  popupOkButton.style.display = 'none';
}

function pauseGame() {
  console.log('pauseGame() called.');
  gameState.gamePaused = true;
  pauseOverlay.classList.remove('hidden');
}

function unpauseGame() {
  console.log('unpauseGame() called.');
  gameState.gamePaused = false;
  pauseOverlay.classList.add('hidden');
}

document.addEventListener('keydown', (event) => {
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return;
  }

  if (event.key === ' ' || event.key === 'Spacebar') {
    event.preventDefault();

    if (!gameState.popupActive) {
      if (gameState.gamePaused) {
        console.log('Unpausing the game...');
        unpauseGame();
      } else {
        console.log('Pausing the game...');
        pauseGame();
      }
    }
  }
});

function startTrainAnimations() {
  gameState.lastFrameTime = performance.now();
  requestAnimationFrame(trainAnimationLoop);
}

function trainAnimationLoop(currentTime) {
  if (!gameState.gamePaused && !gameState.popupActive) {
    const deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;

    spawnTrainsIfNeeded(deltaTime);

    updateTrainAnimations(deltaTime);

    renderGame();
  }

  requestAnimationFrame(trainAnimationLoop);
}

function spawnTrainsIfNeeded(deltaTime) {
  const availableTracks = gameState.tracks.filter(track => !isTrackAssigned(track)).length;
  const availableTrains = gameState.trains.filter(train => !isTrainAnimating(train.id)).length;

  const tracksToAssign = Math.min(availableTracks, availableTrains);

  if (tracksToAssign === 0) return;

  const unassignedTracks = gameState.tracks.filter(track => !isTrackAssigned(track));
  const availableTrainsList = gameState.trains.filter(train => !isTrainAnimating(train.id));

  for (let i = 0; i < tracksToAssign; i++) {
    const track = unassignedTracks[i];
    const train = availableTrainsList[i];
    if (track && train) {
      const direction = Math.random() < 0.5 ? 'forward' : 'backward';
      const startCity = direction === 'forward' ? getCityById(track.cityA) : getCityById(track.cityB);
      const endCity = direction === 'forward' ? getCityById(track.cityB) : getCityById(track.cityA);

      if (startCity && endCity) {
        const angle = Math.atan2(endCity.y - startCity.y, endCity.x - startCity.x);

        const animation = {
          trainId: train.id,
          track: track,
          progress: 0,
          angle: angle,
          scale: 0.3,
          image: trainImage,
          startCity: startCity,
          endCity: endCity,
          direction: direction,
          speed: train.speed,
        };

        gameState.activeTrainAnimations.push(animation);
      }
    }
  }
}

function isTrainAnimating(trainId) {
  return gameState.activeTrainAnimations.some(anim => anim.trainId === trainId);
}

function isTrackAssigned(track) {
  return gameState.activeTrainAnimations.some(anim => anim.track === track);
}

function updateTrainAnimations(deltaTime) {
  gameState.activeTrainAnimations.forEach(animation => {
    const totalDistance = calculateDistance(animation.startCity, animation.endCity);
    const distancePerSecond = animation.speed;
    const distanceThisFrame = distancePerSecond * deltaTime;
    const progressChange = distanceThisFrame / totalDistance;

    if (animation.direction === 'backward') {
      animation.progress += progressChange;
      if (animation.progress >= 1) {
        animation.progress = 1;
        animation.direction = 'forward';
      }
    } else {
      animation.progress -= progressChange;
      if (animation.progress <= 0) {
        animation.progress = 0;
        animation.direction = 'backward';
      }
    }
  });
}

function drawTrainAnimation(animation) {
  const { startCity, endCity, progress, angle, scale, image, direction } = animation;

  const trainImg = image instanceof HTMLImageElement ? image : trainImage;

  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  const currentX = startCity.x + (endCity.x - startCity.x) * clampedProgress;
  const currentY = startCity.y + (endCity.y - startCity.y) * clampedProgress;

  let rotation = angle;
  if (direction === 'backward') {
    rotation += Math.PI;
  }

  ctx.save();
  ctx.translate(currentX, currentY);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.drawImage(trainImg, -trainImg.width / 2, -trainImg.height / 2);
  ctx.restore();
}
