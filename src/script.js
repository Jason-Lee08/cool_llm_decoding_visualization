// Sample data structure: array of steps, each with token options and probabilities
// Structure: { tokens: [...], selected: "word" } - selected is deterministically "chosen"
const sampleData = [
    {
        context: "The cat sat on the",
        tokens: [
            { word: "mat", prob: 0.45 },
            { word: "windowsill", prob: 0.25 },
            { word: "chair", prob: 0.15 },
            { word: "table", prob: 0.08 },
            { word: "bed", prob: 0.04 },
            { word: "couch", prob: 0.02 },
            { word: "rug", prob: 0.01 }
        ],
        selected: "windowsill"  // Pre-selected for coherent sentence
    },
    {
        context: "and",
        tokens: [
            { word: "watched", prob: 0.38 },
            { word: "observed", prob: 0.22 },
            { word: "stared", prob: 0.18 },
            { word: "gazed", prob: 0.12 },
            { word: "looked", prob: 0.06 },
            { word: "saw", prob: 0.03 },
            { word: "noticed", prob: 0.01 }
        ],
        selected: "watched"
    },
    {
        context: "the",
        tokens: [
            { word: "birds", prob: 0.42 },
            { word: "squirrels", prob: 0.28 },
            { word: "clouds", prob: 0.15 },
            { word: "trees", prob: 0.08 },
            { word: "people", prob: 0.04 },
            { word: "cars", prob: 0.02 },
            { word: "children", prob: 0.01 }
        ],
        selected: "birds"
    },
    {
        context: "outside",
        tokens: [
            { word: "peacefully", prob: 0.35 },
            { word: "quietly", prob: 0.30 },
            { word: "contentedly", prob: 0.20 },
            { word: "calmly", prob: 0.10 },
            { word: "lazily", prob: 0.03 },
            { word: "serenely", prob: 0.01 },
            { word: "silently", prob: 0.01 }
        ],
        selected: "contentedly"
    }
];

// Beam search specific data - using log probabilities like real beam search
const beamSearchData = [
    {
        // Step 1: expand from <BOS>
        tokens: [
            { word: "I", logProb: -0.1 },
            { word: "You", logProb: -0.4 },
            { word: "We", logProb: -0.6 },
            { word: "They", logProb: -1.2 },
            { word: "She", logProb: -1.5 }
        ]
    },
    {
        // Step 2: expand each beam
        expansions: [
            // From "I" (-0.1)
            [
                { word: "am", logProb: -0.2 },      // cumulative: -0.3
                { word: "like", logProb: -0.5 },    // cumulative: -0.6
                { word: "will", logProb: -0.7 }     // cumulative: -0.8
            ],
            // From "You" (-0.4)
            [
                { word: "are", logProb: -0.1 },     // cumulative: -0.5
                { word: "can", logProb: -0.3 },     // cumulative: -0.7
                { word: "will", logProb: -0.6 }     // cumulative: -1.0
            ],
            // From "We" (-0.6)
            [
                { word: "are", logProb: -0.2 },     // cumulative: -0.8
                { word: "can", logProb: -0.1 },     // cumulative: -0.7
                { word: "will", logProb: -0.4 }     // cumulative: -1.0
            ]
        ]
    },
    {
        // Step 3: expand top 3 from step 2
        expansions: [
            // From "I am" (-0.3)
            [
                { word: "happy", logProb: -0.2 },   // cumulative: -0.5
                { word: "done", logProb: -0.4 },    // cumulative: -0.7
                { word: "here", logProb: -0.6 }     // cumulative: -0.9
            ],
            // From "You are" (-0.5)
            [
                { word: "right", logProb: -0.1 },   // cumulative: -0.6
                { word: "here", logProb: -0.3 },    // cumulative: -0.8
                { word: "done", logProb: -0.5 }     // cumulative: -1.0
            ],
            // From "I like" (-0.6)
            [
                { word: "it", logProb: -0.1 },      // cumulative: -0.7
                { word: "this", logProb: -0.2 },    // cumulative: -0.8
                { word: "apples", logProb: -0.4 }   // cumulative: -1.0
            ]
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
const BEAM_WIDTH = 3;
const BEAM_COLORS = ['#4CAF50', '#2196F3', '#FF9800']; // Green, Blue, Orange

document.getElementById('beam-start').addEventListener('click', async () => {
    if (beamRunning) return;
    beamRunning = true;
    document.getElementById('beam-start').disabled = true;

    const textOutput = document.getElementById('beam-text');
    const vizContainer = document.getElementById('beam-viz');

    textOutput.innerHTML = '';
    vizContainer.innerHTML = '';

    const prefix = '<BOS> ';

    // Step 1: Initial token selection
    const step1Container = document.createElement('div');
    step1Container.className = 'step-container';
    step1Container.innerHTML = `<div class="step-title">Step 1: Expand from &lt;BOS&gt;</div>`;

    const leaderboard1 = document.createElement('div');
    leaderboard1.className = 'leaderboard';

    // Show all tokens ranked
    const allTokens1 = [...beamSearchData[0].tokens].sort((a, b) => b.logProb - a.logProb);
    allTokens1.forEach((token, idx) => {
        const item = document.createElement('div');
        item.className = `leaderboard-item ${idx < BEAM_WIDTH ? 'in-beam' : 'excluded'}`;
        const beamColor = idx < BEAM_WIDTH ? BEAM_COLORS[idx] : '#ccc';
        item.innerHTML = `
            <span class="rank" style="color: ${beamColor}">#${idx + 1}</span>
            <span class="token-box" style="border-color: ${beamColor}">${token.word}</span>
            <span class="score-text">Score: ${token.logProb.toFixed(1)}</span>
        `;
        leaderboard1.appendChild(item);
    });

    step1Container.appendChild(leaderboard1);
    vizContainer.appendChild(step1Container);
    await sleep(1500);

    // Initialize beams with top 3 tokens - each gets its own color
    let beams = allTokens1.slice(0, BEAM_WIDTH).map((token, idx) => ({
        text: token.word,
        score: token.logProb,
        tokens: [token.word],
        tokenColors: [idx]  // Track which beam generated each token
    }));

    // Show selected beams
    const selectedBeams1 = document.createElement('div');
    selectedBeams1.className = 'selected-beams-simple';
    beams.forEach((beam, idx) => {
        const beamDiv = document.createElement('div');
        beamDiv.className = 'beam-display-simple';
        beamDiv.innerHTML = `
            <span class="beam-color-dot" style="background: ${BEAM_COLORS[idx]}"></span>
            <span class="beam-sequence"><span class="token-box" style="border-color: ${BEAM_COLORS[idx]}">${beam.tokens[0]}</span></span>
            <span class="beam-score">${beam.score.toFixed(1)}</span>
        `;
        selectedBeams1.appendChild(beamDiv);
    });
    step1Container.appendChild(selectedBeams1);
    await sleep(1500);

    // Steps 2 and 3: Expand and rerank
    for (let stepIdx = 1; stepIdx < beamSearchData.length; stepIdx++) {
        const stepData = beamSearchData[stepIdx];
        const stepNum = stepIdx + 1;

        const stepContainer = document.createElement('div');
        stepContainer.className = 'step-container';
        stepContainer.innerHTML = `<div class="step-title">Step ${stepNum}: Expand & Rerank</div>`;
        vizContainer.appendChild(stepContainer);
        await sleep(1000);

        // Generate all candidates - track color for each token
        let allCandidates = [];
        beams.forEach((beam, beamIdx) => {
            stepData.expansions[beamIdx].forEach(token => {
                const newScore = beam.score + token.logProb;
                allCandidates.push({
                    text: beam.text + ' ' + token.word,
                    score: newScore,
                    tokens: [...beam.tokens, token.word],
                    tokenColors: [...beam.tokenColors, beamIdx], // New token gets current beam's color
                    fromBeamIdx: beamIdx,
                    lastToken: token.word
                });
            });
        });

        // Sort all candidates by score
        allCandidates.sort((a, b) => b.score - a.score);

        // Show leaderboard of ALL candidates
        const leaderboard = document.createElement('div');
        leaderboard.className = 'leaderboard';

        allCandidates.forEach((candidate, idx) => {
            const item = document.createElement('div');
            item.className = `leaderboard-item ${idx < BEAM_WIDTH ? 'in-beam' : 'excluded'}`;

            // Build sequence with each token's color
            let sequenceHTML = '';
            candidate.tokens.forEach((tok, tokIdx) => {
                const tokenColor = BEAM_COLORS[candidate.tokenColors[tokIdx]];
                const isNew = tokIdx === candidate.tokens.length - 1;
                sequenceHTML += `<span class="token-box ${isNew ? 'new-token' : ''}" style="border-color: ${tokenColor}">${tok}</span> `;
            });

            item.innerHTML = `
                <span class="rank">#${idx + 1}</span>
                <span class="sequence-display">${sequenceHTML}</span>
                <span class="score-text">${candidate.score.toFixed(1)}</span>
            `;
            leaderboard.appendChild(item);
        });

        stepContainer.appendChild(leaderboard);
        await sleep(2000);

        // Keep only top BEAM_WIDTH
        beams = allCandidates.slice(0, BEAM_WIDTH).map(candidate => ({
            ...candidate
        }));

        // Show pruning message
        const pruneMessage = document.createElement('div');
        pruneMessage.className = 'prune-message';
        pruneMessage.innerHTML = `⬇ Keep top ${BEAM_WIDTH} (prune ${allCandidates.length - BEAM_WIDTH})`;
        stepContainer.appendChild(pruneMessage);
        await sleep(800);

        // Show selected beams with each token's color
        const selectedBeams = document.createElement('div');
        selectedBeams.className = 'selected-beams-simple';
        beams.forEach((beam, idx) => {
            const beamDiv = document.createElement('div');
            beamDiv.className = 'beam-display-simple';
            const beamColor = BEAM_COLORS[idx];

            let sequenceHTML = '';
            beam.tokens.forEach((tok, tokIdx) => {
                const tokenColor = BEAM_COLORS[beam.tokenColors[tokIdx]];
                sequenceHTML += `<span class="token-box" style="border-color: ${tokenColor}">${tok}</span> `;
            });

            beamDiv.innerHTML = `
                <span class="beam-color-dot" style="background: ${beamColor}"></span>
                <span class="beam-sequence">${sequenceHTML}</span>
                <span class="beam-score">${beam.score.toFixed(1)}</span>
            `;
            selectedBeams.appendChild(beamDiv);
        });
        stepContainer.appendChild(selectedBeams);
        await sleep(1500);
    }

    // Display final results with each token's color
    textOutput.innerHTML = '<div style="font-size: 14px; margin-bottom: 10px;">Final Top 3 Sequences:</div>';
    beams.forEach((beam, idx) => {
        const beamDiv = document.createElement('div');
        beamDiv.className = 'final-beam';
        const beamColor = BEAM_COLORS[idx];

        let sequenceHTML = '';
        beam.tokens.forEach((tok, tokIdx) => {
            const tokenColor = BEAM_COLORS[beam.tokenColors[tokIdx]];
            sequenceHTML += `<span class="token-box" style="border-color: ${tokenColor}">${tok}</span> `;
        });

        beamDiv.innerHTML = `
            <span class="beam-color-dot" style="background: ${beamColor}"></span>
            <span>${sequenceHTML}</span>
            <span style="color: #666; font-size: 13px;">(${beam.score.toFixed(1)})</span>
        `;
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
        stepContainer.innerHTML = `<div class="step-title">Step ${i + 1}: Generate next token</div>`;

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

        // Show description
        const descDiv = document.createElement('div');
        descDiv.className = 'sampling-description';
        descDiv.innerHTML = `Sort by probability → Keep tokens until cumulative probability ≥ ${pValue} → Randomly sample`;
        stepContainer.appendChild(descDiv);

        // Show all candidates in a leaderboard style
        const leaderboard = document.createElement('div');
        leaderboard.className = 'leaderboard';

        sortedTokens.forEach((token, idx) => {
            const inNucleus = nucleusTokens.some(t => t.word === token.word);
            const item = document.createElement('div');
            item.className = `leaderboard-item ${inNucleus ? 'in-nucleus' : 'excluded'}`;

            const cumToken = nucleusTokens.find(t => t.word === token.word);

            item.innerHTML = `
                <span class="rank">#${idx + 1}</span>
                <span class="token-box" style="border-color: ${inNucleus ? '#9C27B0' : '#ccc'}">${token.word}</span>
                <span class="prob-text">${(token.prob * 100).toFixed(1)}%</span>
                ${inNucleus ? `<span class="cumulative-text">Cumulative: ${(cumToken.cumulative * 100).toFixed(1)}%</span>` : ''}
            `;
            leaderboard.appendChild(item);
        });

        stepContainer.appendChild(leaderboard);
        vizContainer.appendChild(stepContainer);
        await sleep(1500);

        // Show random selection
        const selectionDiv = document.createElement('div');
        selectionDiv.className = 'random-selection';
        selectionDiv.innerHTML = `🎲 Randomly selecting from ${nucleusTokens.length} tokens in nucleus...`;
        stepContainer.appendChild(selectionDiv);
        await sleep(800);

        // Use pre-selected token for deterministic, coherent output
        const selectedToken = nucleusTokens.find(t => t.word === step.selected);

        // Highlight selected
        selectionDiv.innerHTML = `✓ Selected: <span class="token-box selected-token" style="border-color: #9C27B0">${selectedToken.word}</span>`;
        await sleep(1000);

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
        stepContainer.innerHTML = `<div class="step-title">Step ${i + 1}: Generate next token</div>`;

        // Sort tokens by probability (descending)
        const sortedTokens = [...step.tokens].sort((a, b) => b.prob - a.prob);

        // Take top-k tokens
        const topKTokens = sortedTokens.slice(0, kValue);

        // Show description
        const descDiv = document.createElement('div');
        descDiv.className = 'sampling-description';
        descDiv.innerHTML = `Sort by probability → Keep top ${kValue} tokens → Randomly sample`;
        stepContainer.appendChild(descDiv);

        // Show all candidates in a leaderboard style
        const leaderboard = document.createElement('div');
        leaderboard.className = 'leaderboard';

        sortedTokens.forEach((token, idx) => {
            const inTopK = topKTokens.some(t => t.word === token.word);
            const item = document.createElement('div');
            item.className = `leaderboard-item ${inTopK ? 'in-topk' : 'excluded'}`;

            item.innerHTML = `
                <span class="rank">#${idx + 1}</span>
                <span class="token-box" style="border-color: ${inTopK ? '#FF5722' : '#ccc'}">${token.word}</span>
                <span class="prob-text">${(token.prob * 100).toFixed(1)}%</span>
            `;
            leaderboard.appendChild(item);
        });

        stepContainer.appendChild(leaderboard);
        vizContainer.appendChild(stepContainer);
        await sleep(1500);

        // Show random selection
        const selectionDiv = document.createElement('div');
        selectionDiv.className = 'random-selection';
        selectionDiv.innerHTML = `🎲 Randomly selecting from top ${kValue} tokens...`;
        stepContainer.appendChild(selectionDiv);
        await sleep(800);

        // Use pre-selected token for deterministic, coherent output
        const selectedToken = topKTokens.find(t => t.word === step.selected);

        // Highlight selected
        selectionDiv.innerHTML = `✓ Selected: <span class="token-box selected-token" style="border-color: #FF5722">${selectedToken.word}</span>`;
        await sleep(1000);

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
