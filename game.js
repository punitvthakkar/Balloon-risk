// Game state variables
let currentBalloonSize = 1;
let currentBalloonValue = 0;
let currentBalloonMaxSize;
let totalScore = 0;
let balloonCount = 1;
const totalBalloons = 10; // Use const for values that don't change
let pumpHistory = [];
let isBalloonPopped = false; // Flag to prevent multiple actions after pop

// DOM Elements
const welcomeScreen = document.getElementById('welcome-screen');
const gameScreen = document.getElementById('game-screen');
const resultsScreen = document.getElementById('results-screen');
const startButton = document.getElementById('start-button');
const pumpButton = document.getElementById('pump-button');
const cashoutButton = document.getElementById('cashout-button');
const playAgainButton = document.getElementById('play-again-button');
const balloon = document.getElementById('balloon');
const balloonCountDisplay = document.getElementById('balloon-count');
const currentPointsDisplay = document.getElementById('current-points');
const totalScoreDisplay = document.getElementById('total-score');
const finalScoreDisplay = document.getElementById('final-score');
const riskDescription = document.getElementById('risk-description');

// Event listeners
startButton.addEventListener('click', startGame);
pumpButton.addEventListener('click', pumpBalloon);
cashoutButton.addEventListener('click', cashOut);
playAgainButton.addEventListener('click', resetGame);

// Game functions
function startGame() {
    welcomeScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    resultsScreen.classList.add('hidden'); // Ensure results are hidden
    resetGameVariables(); // Separate variable reset
    setupNextBalloon(); // Setup the first balloon
    updateDisplay();
}

function resetGameVariables() {
    totalScore = 0;
    balloonCount = 1;
    pumpHistory = [];
}

function resetGame() {
    // Simply restart the game process
    startGame();
}

function resetBalloonState() {
    currentBalloonSize = 1; // Start counting pumps from 1
    currentBalloonValue = 0;
    // Random max size between 3 and 10 pumps (inclusive)
    // So, max pumps allowed is currentBalloonMaxSize - 1
    currentBalloonMaxSize = Math.floor(Math.random() * 8) + 3; // 3, 4, ..., 10
    isBalloonPopped = false; // Reset pop flag
    pumpButton.disabled = false; // Re-enable buttons
    cashoutButton.disabled = false;
}

function setupNextBalloon() {
    resetBalloonState();
    // Reset visual appearance
    balloon.style.width = '50px';
    balloon.style.height = '50px';
    balloon.style.opacity = 1; // Ensure it's visible
    balloon.style.transform = 'scale(1)'; // Reset scale from pop animation
    balloon.classList.remove('balloon-pop');
    updateDisplay();
}


function pumpBalloon() {
    if (isBalloonPopped) return; // Prevent pumping after pop

    currentBalloonValue += 10; // Points earned *for this pump*
    
    // Check if balloon *will* pop with this pump
    if (currentBalloonSize >= currentBalloonMaxSize) {
        balloonPop();
    } else {
        // Only increase size and update display if not popping yet
        currentBalloonSize++;
        // Update balloon size visually
        const baseSize = 50;
        const growthFactor = 15;
        const newSize = baseSize + ((currentBalloonSize -1) * growthFactor); // Size based on pumps completed
        balloon.style.width = newSize + 'px';
        balloon.style.height = newSize + 'px';
        updateDisplay();
    }
}

function balloonPop() {
    isBalloonPopped = true; // Set flag
    pumpButton.disabled = true; // Disable buttons during animation/transition
    cashoutButton.disabled = true;

    // Visual pop effect
    balloon.classList.add('balloon-pop');

    // Record pump count (the pump that caused the pop)
    pumpHistory.push({
        balloon: balloonCount,
        pumps: currentBalloonSize, // Record the pump number that popped it
        cashed: false,
        pointsEarned: 0 // Earned 0 for this balloon
    });

    // Reset current value for display
    currentBalloonValue = 0;
    updateDisplay(); // Show 0 points for the current balloon

    // Move to next balloon after a delay
    setTimeout(() => {
        nextBalloon();
    }, 1000); // Match animation duration + buffer
}

function cashOut() {
    if (isBalloonPopped) return; // Prevent cashing out after pop

    pumpButton.disabled = true; // Disable buttons during transition
    cashoutButton.disabled = true;

    // Add current value to total score
    totalScore += currentBalloonValue;

    // Record pump count and success
    pumpHistory.push({
        balloon: balloonCount,
        pumps: currentBalloonSize - 1, // Record pumps *completed* before cashing out
        cashed: true,
        pointsEarned: currentBalloonValue
    });

    // Move to next balloon immediately (no pop animation)
    nextBalloon();
}

function nextBalloon() {
    balloonCount++;

    if (balloonCount > totalBalloons) {
        endGame();
    } else {
        setupNextBalloon(); // Setup the next balloon
    }
}

function updateDisplay() {
    balloonCountDisplay.textContent = Math.min(balloonCount, totalBalloons); // Don't show 11/10
    currentPointsDisplay.textContent = currentBalloonValue;
    totalScoreDisplay.textContent = totalScore;
}

function endGame() {
    gameScreen.classList.add('hidden');
    resultsScreen.classList.remove('hidden');
    finalScoreDisplay.textContent = totalScore;

    // Calculate risk profile
    const riskProfile = calculateRiskProfile();
    riskDescription.textContent = generateRiskDescription(riskProfile);
}

function calculateRiskProfile() {
    // Ensure pumpHistory has data to avoid division by zero
    if (pumpHistory.length === 0) {
        return {
            successRate: 0,
            averagePumps: 0,
            consistencyScore: 0,
            averagePointsPerBalloon: 0
        };
    }

    const successfulCashouts = pumpHistory.filter(item => item.cashed).length;
    const totalPumpsAttempted = pumpHistory.reduce((sum, item) => sum + item.pumps, 0);
    const totalPointsEarned = pumpHistory.reduce((sum, item) => sum + item.pointsEarned, 0);

    const averagePumps = totalPumpsAttempted / pumpHistory.length;
    const averagePointsPerBalloon = totalPointsEarned / pumpHistory.length;
    const consistencyScore = calculateConsistency();

    return {
        successRate: successfulCashouts / totalBalloons,
        averagePumps: averagePumps,
        consistencyScore: consistencyScore,
        averagePointsPerBalloon: averagePointsPerBalloon // Added for potentially more nuanced feedback
    };
}


function calculateConsistency() {
    if (pumpHistory.length <= 1) return 1; // Max consistency if 0 or 1 data points

    // Use pumps attempted before cashout/pop for consistency calculation
    const pumpCounts = pumpHistory.map(item => item.pumps);

    const avg = pumpCounts.reduce((sum, pumps) => sum + pumps, 0) / pumpCounts.length;
    const squareDiffs = pumpCounts.map(pumps => Math.pow(pumps - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
    const stdDev = Math.sqrt(avgSquareDiff);

    // Normalize standard deviation relative to the typical range of pumps (e.g., 1 to 10 pumps)
    // A higher std dev means less consistency. We want 1 for low std dev.
    // Max possible std dev is roughly half the range, ~ (10-1)/2 = 4.5
    // Let's scale based on a max expected std dev of around 5.
    const maxExpectedStdDev = 4; // Tunable parameter
    const normalizedStdDev = Math.min(stdDev / maxExpectedStdDev, 1); // Cap at 1

    // Consistency score: 1 is perfectly consistent, 0 is highly variable
    return Math.max(0, 1 - normalizedStdDev);
}


function generateRiskDescription(profile) {
    // Refined logic based on profile metrics
    const avgP = profile.averagePumps;
    const succRate = profile.successRate;
    const consScore = profile.consistencyScore;

    console.log("Profile:", profile); // For debugging

    if (succRate >= 0.8 && avgP <= 4 && consScore >= 0.7) {
        return "Highly Cautious & Consistent: You prioritize safety, consistently taking small, guaranteed profits. Excellent risk control, typical for highly regulated roles, though potentially leaving value on the table.";
    } else if (succRate >= 0.7 && avgP <= 5) {
        return "Conservative & Controlled: You demonstrate strong risk control, preferring safer bets. This prudence aligns well with managing operational risk in transaction banking.";
    } else if (succRate >= 0.6 && avgP <= 6 && consScore >= 0.6) {
        return "Balanced Risk Taker: You effectively balance risk and reward, achieving good results with calculated risks. A solid approach for many banking scenarios.";
    } else if (avgP > 6.5 && succRate < 0.5) {
        return "High Risk Appetite: You push the limits frequently, leading to more pops than successes. While potentially rewarding elsewhere, transaction banking often favors more conservative strategies.";
     } else if (avgP > 6 && succRate >= 0.5) {
        return "Aggressive but Often Successful: You take significant risks but manage to cash out often enough. Be mindful that consistency might be key in real-world scenarios.";
    } else if (consScore < 0.4) {
        return "Inconsistent Strategy: Your decisions vary significantly from one balloon to the next. Developing a more consistent approach to risk assessment could improve overall results in stable environments.";
    } else if (succRate < 0.4) {
        return "Risk Prone: Your strategy resulted in frequent bursts. Re-evaluating when to cash out could significantly improve your score and align better with risk management principles.";
    } else {
        // Default catch-all
        return "Your risk profile shows a unique pattern. Consider how your average pumps (" + avgP.toFixed(1) + ") and success rate (" + (succRate * 100).toFixed(0) + "%) reflect your approach to risk.";
    }
}
