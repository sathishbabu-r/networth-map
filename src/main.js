import './style.css';
import { attachVoice } from './voice.js';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';

const url = import.meta.env.VITE_CONVEX_URL;
const client = url ? new ConvexHttpClient(url) : null;
const messages = [];
let pending = false;
const root = document.querySelector('#app');
root.innerHTML = `<header><a href="/" class="brand">My Money Huddle</a><span>Blueprint → Vision → MAP</span></header><main class="conversation"><aside><h1>Let’s talk about your money.</h1><p>Start with what matters to you. Together, we’ll understand where you stand and find a useful first step.</p><p class="privacy">This is an early coach trial. Messages are processed by Convex and an AI provider. Voice may also use your browser’s online speech service. This app does not save your conversation or audio; closing or refreshing clears this session. Provider retention has not been verified.</p></aside><section aria-label="Conversation with your coach"><div id="messages" role="log" aria-live="polite"></div><form><div id="voice"></div><label for="answer">Review your words, or type instead</label><textarea id="answer" rows="3" maxlength="5000" placeholder="Tell me what’s on your mind…"></textarea><label class="voice-consent"><input id="chat-consent" type="checkbox"> I understand how this conversation is processed</label><p id="error" role="alert"></p><p id="waiting" role="status"></p><div class="controls"><button type="submit">Send to coach</button></div></form></section></main><footer>Estimates and “I don’t know” are welcome. You choose your goal and actions.</footer>`;
const log = document.querySelector('#messages');
const input = document.querySelector('#answer');
const send = document.querySelector('button[type=submit]');
const error = document.querySelector('#error');
const waiting = document.querySelector('#waiting');
function bubble(role, text) {
  const entry = document.createElement('article'); entry.className = `message ${role}`;
  const name = document.createElement('p'); name.className = 'speaker'; name.textContent = role === 'user' ? 'You' : 'Your coach';
  const content = document.createElement('p'); content.textContent = text;
  entry.append(name, content); log.append(entry);
}
bubble('assistant', 'What is the one financial issue on your mind right now?');
// Voice helper uses a navigation control to lock while listening. This trial has no Back control.
const noBack = document.createElement('button'); noBack.disabled = true;
attachVoice(document.querySelector('#voice'), input, send, noBack);
function lock(value) {
  pending = value; send.disabled = value; input.readOnly = value;
  document.querySelector('#voice button').disabled = value || !(window.SpeechRecognition || window.webkitSpeechRecognition);
  waiting.textContent = value ? 'Your coach is thinking…' : '';
}
document.querySelector('form').onsubmit = async event => {
  event.preventDefault(); if (pending) return;
  error.textContent = '';
  if (!document.querySelector('#chat-consent').checked) { error.textContent = 'Please read the processing note and tick the box before sending.'; return; }
  const answer = input.value.trim();
  if (!answer) { error.textContent = 'Speak or type an answer first.'; input.focus(); return; }
  if (!client) { error.textContent = 'The coach connection has not been configured yet.'; return; }
  lock(true);
  try {
    const result = await client.action(api.coach.reply, { messages: [...messages, {role:'user',content:answer}] });
    if (result.error) { error.textContent = result.error; return; }
    messages.push({role:'user',content:answer},{role:'assistant',content:result.text});
    bubble('user', answer); bubble('assistant', result.text); input.value = '';
  } catch { error.textContent = 'The coach could not connect. Your answer is still here; try sending again.'; }
  finally { lock(false); input.focus(); }
};
