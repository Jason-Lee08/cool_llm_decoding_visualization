// Sample data structure: array of steps, each with token options and probabilities
const sampleData = [
    {
        context: "The cat sat on the",
        tokens: [
            { word: "mat", prob: 0.45 },
            { word: "floor", prob: 0.25 },
            { word: "chair", prob: 0.15 },
            { word: "table", prob: 0.08 },
            { word: "bed", prob: 0.04 },
            { word: "couch", prob: 0.02 },
            { word: "rug", prob: 0.01 }
        ]
    },
    {
        context: "and watched the",
        tokens: [
            { word: "birds", prob: 0.38 },
            { word: "dog", prob: 0.22 },
            { word: "sunset", prob: 0.18 },
            { word: "children", prob: 0.12 },
            { word: "clouds", prob: 0.06 },
            { word: "squirrel", prob: 0.03 },
            { word: "sky", prob: 0.01 }
        ]
    },
    {
        context: "playing in the",
        tokens: [
            { word: "garden", prob: 0.42 },
            { word: "yard", prob: 0.28 },
            { word: "park", prob: 0.15 },
            { word: "field", prob: 0.08 },
            { word: "grass", prob: 0.04 },
            { word: "meadow", prob: 0.02 },
            { word: "distance", prob: 0.01 }
        ]
    },
    {
        context: "with great",
        tokens: [
            { word: "enthusiasm", prob: 0.35 },
            { word: "joy", prob: 0.30 },
            { word: "energy", prob: 0.20 },
            { word: "excitement", prob: 0.10 },
            { word: "pleasure", prob: 0.03 },
            { word: "delight", prob: 0.01 },
            { word: "vigor", prob: 0.01 }
        ]
    }
];

// Tab switching functionality
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.dataset.tab;

        // Update active tab button
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Update active tab pane
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');
    });
});

// Utility function to create token display
function createTokenElement(token, isSelected = false, isExcluded = false, additionalClass = '') {
    const tokenEl = document.createElement('div');
    tokenEl.className = `token-item ${isSelected ? 'selected' : ''} ${isExcluded ? 'excluded' : ''} ${additionalClass}`;
    tokenEl.innerHTML = `
        <div class="token-word">"${token.word}"</div>
        <div class="token-prob">${(token.prob * 100).toFixed(1)}%</div>
    `;
    return tokenEl;
}

// GREEDY DECODING
let greedyRunning = false;

document.getElementById('greedy-start').addEventListener('click', async () => {
    if (greedyRunning) return;
    greedyRunning = true;
    document.getElementById('greedy-start').disabled = true;

    const textOutput = document.getElementById('greedy-text');
    const vizContainer = document.getElementById('greedy-viz');

    textOutput.innerHTML = 'The cat sat on the ';
    vizContainer.innerHTML = '';

    for (let i = 0; i < sampleData.length; i++) {
        const step = sampleData[i];
        const stepContainer = document.createElement('div');
        stepContainer.className = 'step-container';
        stepContainer.innerHTML = `<div class="step-title">Step ${i + 1}: ${step.context}</div>`;

        const tokensGrid = document.createElement('div');
        tokensGrid.className = 'tokens-grid';

        // Sort tokens by probability (descending)
        const sortedTokens = [...step.tokens].sort((a, b) => b.prob - a.prob);
        const bestToken = sortedTokens[0];

        // Display all tokens
        sortedTokens.forEach(token => {
            const isSelected = token.word === bestToken.word;
            tokensGrid.appendChild(createTokenElement(token, isSelected));
        });

        stepContainer.appendChild(tokensGrid);
        vizContainer.appendChild(stepContainer);

        await sleep(1000);

        // Add selected token to text
        textOutput.innerHTML += `<span class="token-highlight">${bestToken.word}</span> `;
        await sleep(500);
    }

    greedyRunning = false;
    document.getElementById('greedy-start').disabled = false;
});

document.getElementById('greedy-reset').addEventListener('click', () => {
    document.getElementById('greedy-text').innerHTML = '';
    document.getElementById('greedy-viz').innerHTML = '';
});

// BEAM SEARCH
let beamRunning = false;

document.getElementById('beam-width').addEventListener('input', (e) => {
    document.getElementById('beam-width-value').textContent = e.target.value;
});

document.getElementById('beam-start').addEventListener('click', async () => {
    if (beamRunning) return;
    beamRunning = true;
    document.getElementById('beam-start').disabled = true;

    const beamWidth = parseInt(document.getElementById('beam-width').value);
    const textOutput = document.getElementById('beam-text');
    const vizContainer = document.getElementById('beam-viz');

    textOutput.innerHTML = '';
    vizContainer.innerHTML = '';

    // Initialize beams with empty sequences
    let beams = [{ text: 'The cat sat on the ', score: 0 }];

    for (let i = 0; i < sampleData.length; i++) {
        const step = sampleData[i];
        const stepContainer = document.createElement('div');
        stepContainer.className = 'step-container';
        stepContainer.innerHTML = `<div class="step-title">Step ${i + 1}: Expanding beams</div>`;

        // Generate candidates from each beam
        let candidates = [];
        beams.forEach(beam => {
            step.tokens.forEach(token => {
                candidates.push({
                    text: beam.text + token.word + ' ',
                    score: beam.score + Math.log(token.prob),
                    lastToken: token.word,
                    prob: token.prob
                });
            });
        });

        // Sort by score and keep top beamWidth
        candidates.sort((a, b) => b.score - a.score);
        beams = candidates.slice(0, beamWidth);

        // Display beams
        const beamContainer = document.createElement('div');
        beamContainer.className = 'beam-container';
        beams.forEach((beam, idx) => {
            const beamItem = document.createElement('div');
            beamItem.className = `beam-item ${idx === 0 ? 'best' : ''}`;
            beamItem.innerHTML = `
                <div class="beam-text">${beam.text}</div>
                <div class="beam-score">Score: ${beam.score.toFixed(3)} (last token: "${beam.lastToken}" - ${(beam.prob * 100).toFixed(1)}%)</div>
            `;
            beamContainer.appendChild(beamItem);
        });

        stepContainer.appendChild(beamContainer);
        vizContainer.appendChild(stepContainer);

        await sleep(1500);
    }

    // Display final beams
    textOutput.innerHTML = '';
    beams.forEach((beam, idx) => {
        const beamDiv = document.createElement('div');
        beamDiv.style.marginBottom = '10px';
        beamDiv.innerHTML = `<strong>Beam ${idx + 1}${idx === 0 ? ' (Best)' : ''}:</strong> ${beam.text} <em>(score: ${beam.score.toFixed(3)})</em>`;
        textOutput.appendChild(beamDiv);
    });

    beamRunning = false;
    document.getElementById('beam-start').disabled = false;
});

document.getElementById('beam-reset').addEventListener('click', () => {
    document.getElementById('beam-text').innerHTML = '';
    document.getElementById('beam-viz').innerHTML = '';
});

// NUCLEUS SAMPLING (Top-p)
let nucleusRunning = false;

document.getElementById('p-value').addEventListener('input', (e) => {
    document.getElementById('p-value-display').textContent = e.target.value;
});

document.getElementById('nucleus-start').addEventListener('click', async () => {
    if (nucleusRunning) return;
    nucleusRunning = true;
    document.getElementById('nucleus-start').disabled = true;

    const pValue = parseFloat(document.getElementById('p-value').value);
    const textOutput = document.getElementById('nucleus-text');
    const vizContainer = document.getElementById('nucleus-viz');

    textOutput.innerHTML = 'The cat sat on the ';
    vizContainer.innerHTML = '';

    for (let i = 0; i < sampleData.length; i++) {
        const step = sampleData[i];
        const stepContainer = document.createElement('div');
        stepContainer.className = 'step-container';
        stepContainer.innerHTML = `<div class="step-title">Step ${i + 1}: ${step.context} (p=${pValue})</div>`;

        // Sort tokens by probability (descending)
        const sortedTokens = [...step.tokens].sort((a, b) => b.prob - a.prob);

        // Calculate cumulative probabilities and find nucleus
        let cumulative = 0;
        let nucleusTokens = [];
        for (let token of sortedTokens) {
            cumulative += token.prob;
            nucleusTokens.push({ ...token, cumulative });
            if (cumulative >= pValue) break;
        }

        // Sample from nucleus (for demo, we'll pick randomly with weighted probability)
        const selectedToken = weightedRandomChoice(nucleusTokens);

        const tokensGrid = document.createElement('div');
        tokensGrid.className = 'tokens-grid';

        sortedTokens.forEach(token => {
            const inNucleus = nucleusTokens.some(t => t.word === token.word);
            const isSelected = token.word === selectedToken.word;
            const tokenEl = createTokenElement(token, isSelected, !inNucleus, inNucleus ? 'in-nucleus' : '');

            // Add cumulative probability for nucleus tokens
            if (inNucleus) {
                const cumToken = nucleusTokens.find(t => t.word === token.word);
                const cumDiv = document.createElement('div');
                cumDiv.className = 'cumulative-indicator';
                cumDiv.textContent = `Cumulative: ${(cumToken.cumulative * 100).toFixed(1)}%`;
                tokenEl.appendChild(cumDiv);
            }

            tokensGrid.appendChild(tokenEl);
        });

        stepContainer.appendChild(tokensGrid);
        vizContainer.appendChild(stepContainer);

        await sleep(1500);

        textOutput.innerHTML += `<span class="token-highlight">${selectedToken.word}</span> `;
        await sleep(500);
    }

    nucleusRunning = false;
    document.getElementById('nucleus-start').disabled = false;
});

document.getElementById('nucleus-reset').addEventListener('click', () => {
    document.getElementById('nucleus-text').innerHTML = '';
    document.getElementById('nucleus-viz').innerHTML = '';
});

// TOP-K SAMPLING
let topkRunning = false;

document.getElementById('k-value').addEventListener('input', (e) => {
    document.getElementById('k-value-display').textContent = e.target.value;
});

document.getElementById('topk-start').addEventListener('click', async () => {
    if (topkRunning) return;
    topkRunning = true;
    document.getElementById('topk-start').disabled = true;

    const kValue = parseInt(document.getElementById('k-value').value);
    const textOutput = document.getElementById('topk-text');
    const vizContainer = document.getElementById('topk-viz');

    textOutput.innerHTML = 'The cat sat on the ';
    vizContainer.innerHTML = '';

    for (let i = 0; i < sampleData.length; i++) {
        const step = sampleData[i];
        const stepContainer = document.createElement('div');
        stepContainer.className = 'step-container';
        stepContainer.innerHTML = `<div class="step-title">Step ${i + 1}: ${step.context} (k=${kValue})</div>`;

        // Sort tokens by probability (descending)
        const sortedTokens = [...step.tokens].sort((a, b) => b.prob - a.prob);

        // Take top-k tokens
        const topKTokens = sortedTokens.slice(0, kValue);

        // Sample from top-k (for demo, we'll pick randomly with weighted probability)
        const selectedToken = weightedRandomChoice(topKTokens);

        const tokensGrid = document.createElement('div');
        tokensGrid.className = 'tokens-grid';

        sortedTokens.forEach(token => {
            const inTopK = topKTokens.some(t => t.word === token.word);
            const isSelected = token.word === selectedToken.word;
            const tokenEl = createTokenElement(token, isSelected, !inTopK, inTopK ? 'in-nucleus' : '');
            tokensGrid.appendChild(tokenEl);
        });

        stepContainer.appendChild(tokensGrid);
        vizContainer.appendChild(stepContainer);

        await sleep(1500);

        textOutput.innerHTML += `<span class="token-highlight">${selectedToken.word}</span> `;
        await sleep(500);
    }

    topkRunning = false;
    document.getElementById('topk-start').disabled = false;
});

document.getElementById('topk-reset').addEventListener('click', () => {
    document.getElementById('topk-text').innerHTML = '';
    document.getElementById('topk-viz').innerHTML = '';
});

// Utility functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function weightedRandomChoice(tokens) {
    // Renormalize probabilities for the subset
    const totalProb = tokens.reduce((sum, t) => sum + t.prob, 0);
    const normalized = tokens.map(t => ({ ...t, prob: t.prob / totalProb }));

    const rand = Math.random();
    let cumulative = 0;

    for (let token of normalized) {
        cumulative += token.prob;
        if (rand <= cumulative) {
            return token;
        }
    }

    return normalized[0]; // Fallback
}
