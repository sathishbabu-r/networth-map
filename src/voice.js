let voiceConsent = false;
export function attachVoice(container, input, next, back) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  container.innerHTML = `<button type="button" class="microphone"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></svg><span>Tap to speak</span></button><p class="voice-status" role="status" aria-live="polite">Speak naturally. Review the words before confirming.</p><details><summary>Before using the microphone</summary><p>Your browser’s speech service may send audio online for transcription. Its retention rules depend on your browser and provider; we have not verified them. This app does not store audio. The words stay in this tab until you close or refresh it. Use typing if you prefer.</p><label class="voice-consent"><input type="checkbox"> I understand and want to use voice</label></details>`;
  const button = container.querySelector('button');
  const status = container.querySelector('.voice-status');
  const consent = container.querySelector('input');
  consent.checked = voiceConsent;
  consent.onchange = () => { voiceConsent = consent.checked; };
  let recognition;
  let active = false;
  let failed = false;
  let base = '';
  let confirmed = '';
  let timeout;
  if (!Recognition) {
    button.disabled = true;
    status.textContent = 'Voice is unavailable in this browser. You can type your answer below.';
    return;
  }
  function busy(value) {
    active = value; next.disabled = value; back.disabled = value || !back.dataset.canGoBack;
    input.readOnly = value;
    container.closest('form').querySelectorAll('.choice').forEach(choice => { choice.disabled = value; });
    button.querySelector('span').textContent = value ? 'Tap to stop' : 'Tap to speak';
    button.classList.toggle('listening', value);
    button.setAttribute('aria-pressed', String(value));
  }
  back.dataset.canGoBack = back.disabled ? '' : 'yes';
  button.onclick = () => {
    if (active) { button.disabled = true; status.textContent = 'Finishing your answer…'; recognition.stop(); return; }
    if (!consent.checked) { container.querySelector('details').open = true; status.textContent = 'Read the note and tick the box before speaking.'; consent.focus(); return; }
    recognition = new Recognition();
    recognition.lang = 'en-IN'; recognition.continuous = true; recognition.interimResults = true;
    base = input.value.trim(); confirmed = ''; failed = false;
    recognition.onstart = () => { status.textContent = 'Listening… tap to stop when you’re ready.'; };
    recognition.onresult = event => {
      let interim = ''; confirmed = '';
      for (const result of event.results) {
        if (result.isFinal) confirmed += result[0].transcript + ' ';
        else interim += result[0].transcript;
      }
      input.value = [base, confirmed.trim(), interim.trim()].filter(Boolean).join(' ');
    };
    recognition.onerror = event => {
      failed = true;
      const messages = {
        'not-allowed': 'Microphone access was blocked. Allow it in your browser’s site settings, then try again, or type below.',
        'audio-capture': 'No microphone was found. Connect one and try again, or type below.',
        'no-speech': 'No speech was heard. Tap to speak and try again.',
        'network': 'The speech service could not connect. Try again or type below.',
        'service-not-allowed': 'Your browser’s speech service is unavailable. Try another supported browser or type below.',
      };
      status.textContent = messages[event.error] || 'Voice could not finish. Your existing answer is still here; try again or type below.';
    };
    recognition.onend = () => {
      clearTimeout(timeout); busy(false); button.disabled = false;
      input.value = [base, confirmed.trim()].filter(Boolean).join(' ');
      if (!failed) status.textContent = confirmed.trim() ? 'Check the words below. Correct anything, then confirm your answer.' : 'No words were captured. Tap to speak again, or type below.';
    };
    try {
      busy(true); recognition.start();
      timeout = setTimeout(() => { if (active) recognition.stop(); }, 60000);
    } catch {
      busy(false); status.textContent = 'Voice could not start. Try again or type below.';
    }
  };
  const abort = () => { clearTimeout(timeout); if (active) recognition.abort(); };
  window.addEventListener('pagehide', abort, { once: true });
}
