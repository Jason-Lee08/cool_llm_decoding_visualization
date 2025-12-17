# LLM Decoding Strategies Visualization

An interactive web-based visualization demonstrating how different token generation (decoding) strategies work in Large Language Models (LLMs). This project runs entirely in the browser with no backend required, making it perfect for GitHub Pages hosting.

Check it out here: https://jason-lee08.github.io/cool_llm_decoding_visualization/

## Overview

This website provides animated, step-by-step visualizations of four common decoding strategies used in LLMs:

1. **Greedy Decoding**
2. **Beam Search**
3. **Nucleus Sampling (Top-p)**
4. **Top-k Sampling**

## How It Works

### General Concept

Large Language Models generate text one token (word/subword) at a time. At each step, the model produces a probability distribution over all possible next tokens. The decoding strategy determines which token to select from this distribution.

The website uses pre-defined example data with realistic probability distributions for a sample sentence: "The cat sat on the [mat/floor/...] and watched the [birds/dog/...] playing in the [garden/yard/...] with great [enthusiasm/joy/...]"

### Decoding Strategies

#### 1. Greedy Decoding

**How it works:**
- At each step, always select the token with the highest probability
- Deterministic: always produces the same output for the same input
- Fast and simple, but can lead to repetitive or suboptimal text

**Visualization shows:**
- All candidate tokens with their probabilities
- The highest probability token is highlighted and selected
- The generated text builds up token by token

**Use case:** When you want predictable, deterministic output and speed is important

#### 2. Beam Search

**How it works:**
- Maintains multiple candidate sequences (called "beams") simultaneously
- At each step, expands each beam with all possible next tokens
- Keeps only the top-k sequences based on cumulative log probability scores
- Explores multiple paths through the token space

**Visualization shows:**
- All active beams at each generation step
- The score for each beam (sum of log probabilities)
- The best beam is highlighted in green
- Final output shows all beams ranked by score

**Parameters:**
- **Beam Width (2-5):** Number of candidate sequences to maintain

**Use case:** When you want higher quality output than greedy decoding and are willing to trade speed for better results. Common in translation tasks.

#### 3. Nucleus Sampling (Top-p)

**How it works:**
- Sort tokens by probability in descending order
- Calculate cumulative probability
- Select the smallest set of tokens whose cumulative probability exceeds threshold p
- Randomly sample from this "nucleus" set (weighted by probability)
- Dynamic: the number of candidate tokens varies by step

**Visualization shows:**
- All tokens sorted by probability
- Tokens within the nucleus (cumulative prob ≤ p) highlighted in purple
- Excluded tokens grayed out
- Cumulative probability shown for nucleus tokens
- Randomly selected token highlighted in blue

**Parameters:**
- **p value (0.5-1.0):** Cumulative probability threshold
  - Lower p (e.g., 0.7): More focused, less random
  - Higher p (e.g., 0.95): More diverse, more random

**Use case:** Creative text generation where you want diversity but not complete randomness. Good for chatbots, story generation.

#### 4. Top-k Sampling

**How it works:**
- Sort tokens by probability in descending order
- Keep only the top k tokens with highest probabilities
- Randomly sample from these k tokens (weighted by probability)
- Static: always considers exactly k tokens regardless of their probabilities

**Visualization shows:**
- All tokens sorted by probability
- Top-k tokens highlighted in purple
- Excluded tokens grayed out
- Randomly selected token highlighted in blue

**Parameters:**
- **k value (2-10):** Number of top tokens to consider
  - Lower k (e.g., 3): More focused, less diverse
  - Higher k (e.g., 10): More diverse, more random

**Use case:** When you want controlled randomness with a fixed candidate pool. Simpler than nucleus sampling.

## Files

- `index.html` - Main HTML structure with tabs for each decoding strategy
- `styles.css` - CSS styling and animations
- `script.js` - JavaScript implementation of all decoding algorithms and visualizations

## Running Locally

### Method 1: Direct File Opening
Simply double-click `index.html` to open it in your browser.

### Method 2: Python HTTP Server
```bash
cd /path/to/project
python3 -m http.server 8000
```
Then open http://localhost:8000 in your browser.

### Method 3: Node.js HTTP Server
```bash
cd /path/to/project
npx http-server -p 8000
```
Then open http://localhost:8000 in your browser.

### Method 4: VS Code Live Server
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

## Deploying to GitHub Pages

1. Create a new GitHub repository
2. Push these files to the repository:
   ```bash
   git init
   git add index.html styles.css script.js README.md
   git commit -m "Initial commit: LLM decoding visualization"
   git branch -M main
   git remote add origin https://github.com/yourusername/your-repo-name.git
   git push -u origin main
   ```
3. Go to repository Settings > Pages
4. Under "Source", select "Deploy from a branch"
5. Select the `main` branch and `/ (root)` folder
6. Click Save
7. Your site will be available at `https://yourusername.github.io/your-repo-name/`

## How to Use the Website

1. **Select a decoding strategy** by clicking one of the four tabs at the top
2. **Adjust parameters** (if available) using the sliders:
   - Beam Search: Adjust beam width
   - Nucleus Sampling: Adjust p value
   - Top-k Sampling: Adjust k value
3. **Click "Start Animation"** to watch the decoding process
4. **Observe the visualization**:
   - Watch how tokens are selected at each step
   - See probability distributions and selections
   - Read the generated text as it builds up
5. **Click "Reset"** to clear and try again with different parameters

## Technical Details

### Sample Data Structure

The visualization uses pre-defined probability distributions for demonstration purposes. Each step contains:

```javascript
{
    context: "The cat sat on the",
    tokens: [
        { word: "mat", prob: 0.45 },
        { word: "floor", prob: 0.25 },
        { word: "chair", prob: 0.15 },
        // ... more tokens
    ]
}
```

### Key Features

- No external dependencies or API calls
- Pure vanilla JavaScript (no frameworks)
- Fully client-side execution
- Responsive design
- Animated transitions
- Interactive parameter controls

## Educational Value

This visualization helps understand:

- How LLMs generate text token-by-token
- The tradeoff between deterministic and stochastic decoding
- Why different strategies produce different outputs
- How parameters affect generation quality and diversity
- The difference between greedy, search-based, and sampling approaches

## Limitations

- Uses pre-defined probability distributions (not a real LLM)
- Limited to a short example sentence
- Simplified visualization of complex algorithms
- Does not show temperature parameter effects
- Does not implement all variants (e.g., beam search with sampling)

## Future Enhancements

Possible improvements:
- Add temperature parameter visualization
- Show more example sentences
- Add contrastive search visualization
- Include repetition penalty demonstration
- Add side-by-side comparison mode
- Allow custom probability distributions

## License

This project is open source and available for educational purposes.
