let voiceConsent = false;
export function attachVoice(container, input, next, { ready, transcribe }) {
  container.innerHTML = `<button type="button" class="microphone"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></svg><span>Tap to speak</span></button><p class="voice-status" role="status" aria-live="polite">Speak naturally, then stop to see your words.</p><div class="recording-recovery" hidden><button type="button" class="secondary retry">Retry transcription</button> <button type="button" class="secondary discard">Discard recording</button></div><details><summary>Before using the microphone</summary><p>After you stop, your recording is sent through Convex to OpenAI to turn speech into text. This app does not save recordings. Failed recordings stay in this tab for retry until discarded or the page closes. Provider retention has not been verified. Review the words before sending them to the coach.</p><label class="voice-consent"><input type="checkbox"> I understand and want to use voice</label></details>`;
  const button = container.querySelector('.microphone');
  const status = container.querySelector('.voice-status');
  const consent = container.querySelector('input');
  const recovery = container.querySelector('.recording-recovery');
  consent.checked = voiceConsent;
  consent.onchange = () => { voiceConsent = consent.checked; };
  const supported = Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
  let state = 'idle', stream, recorder, timer, blob;
  let chunks = [], base = '', discarded = false;
  function tracksOff() { stream?.getTracks().forEach(track => track.stop()); stream = null; }
  function setState(value) {
    state = value;
    const busy = !['idle','failed'].includes(value);
    input.readOnly = busy; next.disabled = busy;
    button.disabled = !supported || ['starting','transcribing','stopping'].includes(value);
    button.querySelector('span').textContent = value === 'recording' ? 'Tap to stop' : 'Tap to speak';
    button.classList.toggle('listening', value === 'recording');
    recovery.hidden = value !== 'failed' || !blob;
    container.querySelectorAll('.retry,.discard').forEach(control => { control.disabled = busy; });
  }
  async function convert() {
    setState('transcribing'); status.textContent = 'Turning your speech into words…';
    try {
      const result = await transcribe({ audio: await blob.arrayBuffer(), mimeType: blob.type.split(';')[0] });
      if (result.error) throw new Error(result.error);
      input.value = [base, result.text].filter(Boolean).join(' ');
      blob = null; chunks = []; setState('idle');
      status.textContent = 'Review and correct the words below, then send them to your coach.'; input.focus();
    } catch (error) { setState('failed'); status.textContent = error.message || 'Could not transcribe. Retry or type instead.'; }
  }
  container.querySelector('.retry').onclick = () => { base = input.value.trim(); void convert(); };
  container.querySelector('.discard').onclick = () => { blob = null; chunks = []; setState('idle'); status.textContent = 'Recording discarded. You can speak again or type.'; };
  function stop() { clearTimeout(timer); setState('stopping'); status.textContent = 'Finishing your recording…'; recorder.stop(); tracksOff(); }
  button.onclick = async () => {
    if (state === 'recording') { stop(); return; }
    if (state === 'failed' && blob) { status.textContent = 'Retry or discard the previous recording before starting another.'; return; }
    if (!consent.checked) { container.querySelector('details').open = true; status.textContent = 'Read the note and tick the box before speaking.'; consent.focus(); return; }
    setState('starting'); status.textContent = 'Checking speech-to-text…';
    try {
      if (!(await ready())) { setState('idle'); status.textContent = 'Speech-to-text is waiting for an OpenAI key in Convex. You can type for now.'; return; }
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = ['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
      if (!type) throw new Error('Recording is not supported in this browser. Please type instead.');
      recorder = new MediaRecorder(stream, { mimeType: type, audioBitsPerSecond: 32000 });
      chunks = []; base = input.value.trim(); discarded = false;
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => { discarded = true; clearTimeout(timer); tracksOff(); chunks = []; setState('idle'); status.textContent = 'Recording failed. Your typed answer is still here; please try again.'; };
      recorder.onstop = () => {
        clearTimeout(timer); tracksOff(); if (discarded) return;
        blob = new Blob(chunks, { type: recorder.mimeType }); chunks = [];
        if (blob.size < 100 || blob.size > 750000) { blob = null; setState('idle'); status.textContent = 'The recording was empty or too large. Please record a shorter answer.'; return; }
        void convert();
      };
      recorder.start(); setState('recording'); status.textContent = 'Recording… tap to stop. Each answer can be up to one minute.';
      timer = setTimeout(stop, 60000);
    } catch (error) {
      tracksOff(); setState('idle');
      status.textContent = error.name === 'NotAllowedError' ? 'Microphone access was blocked. Allow access in browser settings or type below.' : error.name === 'NotFoundError' ? 'No microphone was found. Connect one or type below.' : error.message || 'Could not start recording. Please try again or type below.';
    }
  };
  if (!supported) { button.disabled = true; status.textContent = 'Recording is unavailable in this browser. You can type below.'; }
  window.addEventListener('pagehide', () => { discarded = true; clearTimeout(timer); if (recorder?.state === 'recording') recorder.stop(); tracksOff(); blob = null; chunks = []; });
  return { supported, clearRecording() { blob = null; chunks = []; if (state === 'failed') setState('idle'); } };
}
