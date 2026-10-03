import './style.css';

const questions = [
  ['concern', 'What is the one financial issue on your mind right now?', 'A payment, an upcoming expense, a loan or something you keep putting off.'],
  ['scope', 'Which finances would you like to look at?', 'Choose personal finances, business finances or both.'],
  ['income', 'About how much income comes in each month?', 'Include the finances you chose. If it varies, say so.'],
  ['expenses', 'About how much goes out each month?', 'Include regular spending and loan payments. Estimates are welcome.'],
  ['cash', 'What cash and bank balances do you have available?', 'Tell us what you know. You can leave unknown amounts for later.'],
  ['investments', 'What investments do you own?', 'For example, shares, mutual funds or deposits. Include approximate values if known.'],
  ['property', 'What property do you own?', 'Include approximate values and your share of ownership, if known.'],
  ['business', 'What business ownership or business assets should we include?', 'Describe ownership and underlying assets separately so they can be reviewed together later.'],
  ['other', 'Are there any other assets to include?', 'For example, gold or money owed to you. “None” is a valid answer.'],
  ['debts', 'What debts or loans are outstanding?', 'Include approximate balances and whether they are personal or business debts.'],
];
const answers = {};
let step = 0;
const root = document.querySelector('#app');
root.innerHTML = `<header><a href="/" class="brand">My Money Huddle</a><span>A clearer starting point</span></header><main><aside><p class="method">Blueprint → Vision → MAP</p><h1>Start with what’s on your mind.</h1><p>You don’t need all the numbers. We’ll take one question at a time.</p><p class="privacy">For now, answers stay in this open tab. They aren’t sent to an AI provider or saved. Closing or refreshing clears them.</p></aside><section aria-label="Your first session"><div id="question"></div></section></main><footer>Estimates are welcome. Unknown doesn’t mean zero.</footer>`;
const panel = document.querySelector('#question');
function render(focus = false) {
  panel.replaceChildren();
  if (step === questions.length) {
    panel.innerHTML = `<h2 tabindex="-1">Your typed answers are ready.</h2><p>You’ve reached the end of this first step. Reviewing and confirming your snapshot comes next.</p><p>Nothing has been saved yet.</p><button type="button" id="back">Review my answers</button>`;
    panel.querySelector('#back').onclick = () => { step--; render(true); };
    if (focus) panel.querySelector('h2').focus();
    return;
  }
  const [id, question, hint] = questions[step];
  panel.innerHTML = `<p class="progress">Question ${step + 1} of ${questions.length}</p><h2 id="heading" tabindex="-1"></h2><p id="hint"></p><form><label for="answer">Your answer</label><textarea id="answer" rows="4" maxlength="5000" aria-describedby="hint error" placeholder="Type what you know…"></textarea><p id="error" role="alert"></p><div class="choices"></div><div class="controls"><button type="button" class="secondary" id="back">Back</button><button type="submit">Next question</button></div></form>`;
  panel.querySelector('h2').textContent = question;
  panel.querySelector('#hint').textContent = hint;
  const input = panel.querySelector('textarea');
  input.value = answers[id] || '';
  const choices = id === 'scope' ? ['Personal finances', 'Business finances', 'Both'] : ["I don’t know"];
  for (const label of choices) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'choice'; button.textContent = label;
    button.onclick = () => { input.value = label; input.focus(); panel.querySelector('#error').textContent = ''; };
    panel.querySelector('.choices').append(button);
  }
  panel.querySelector('#back').disabled = step === 0;
  panel.querySelector('#back').onclick = () => { answers[id] = input.value; step--; render(true); };
  panel.querySelector('form').onsubmit = (event) => {
    event.preventDefault();
    if (!input.value.trim()) { panel.querySelector('#error').textContent = 'Type an answer or choose “I don’t know” to continue.'; input.focus(); return; }
    answers[id] = input.value.trim(); step++; render(true);
  };
  if (focus) panel.querySelector('h2').focus();
}
render();
