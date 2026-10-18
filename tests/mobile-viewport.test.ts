// @vitest-environment jsdom
import {test, expect, vi, afterEach} from 'vitest';
import {observeMobileViewport} from '../src/mobile-viewport.mjs';

let dispose: (() => void) | undefined;
const initialViewport = Object.getOwnPropertyDescriptor(window, 'visualViewport');
afterEach(() => {
  dispose?.(); dispose = undefined; vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.innerHTML = '';
  if (initialViewport) Object.defineProperty(window, 'visualViewport', initialViewport);
  else Reflect.deleteProperty(window, 'visualViewport');
});
function fixture(viewport: any = new EventTarget()) {
  Object.assign(viewport, {height: 800, offsetTop: 0});
  Object.defineProperty(window, 'visualViewport', {configurable: true, value: viewport});
  vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(390);
  vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800);
  vi.spyOn(window, 'scrollBy').mockImplementation(() => {});
  const root = document.createElement('main');
  root.innerHTML = '<section class="replica-pane"><div class="original-map-scroll"><label class="field"><input><small>Error</small></label></div></section>';
  document.body.append(root);
  const scroller = root.querySelector('.original-map-scroll') as HTMLElement, field = scroller.firstElementChild as HTMLElement, input = root.querySelector('input')!;
  root.getBoundingClientRect = () => ({top: 100} as DOMRect);
  scroller.getBoundingClientRect = () => ({top: 150, bottom: 390} as DOMRect);
  field.getBoundingClientRect = () => ({top: 410, bottom: 500, height: 90} as DOMRect);
  input.getBoundingClientRect = () => ({top: 430, bottom: 460, height: 30} as DOMRect);
  let pending: FrameRequestCallback | undefined;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {pending = callback; return 1;});
  const cancelled = vi.spyOn(window, 'cancelAnimationFrame');
  const flush = () => {const callback = pending; pending = undefined; callback?.(0);};
  dispose = observeMobileViewport(root);
  return {root, scroller, field, input, viewport, flush, cancelled};
}
test('a keyboard that shrinks only the visual viewport resizes the workspace and reveals the focused field and error', () => {
  const {root, scroller, input, viewport, flush} = fixture();
  input.focus(); viewport.height = 400; viewport.dispatchEvent(new Event('resize')); flush();
  expect(root.style.getPropertyValue('--mobile-workspace-height')).toBe('300px');
  expect(root.style.getPropertyValue('--mobile-visible-height')).toBe('400px');
  expect(root.style.getPropertyValue('--mobile-keyboard-space')).toBe('400px');
  expect(scroller.scrollTop).toBe(118); // Whole labelled field including its error, below 382px.
});
test('keyboard panning keeps the focused control above the visible top without mistaking zoom for a new MAP', () => {
  const {root, scroller, input, viewport, flush} = fixture();
  input.focus(); viewport.height = 360; viewport.offsetTop = 200;
  scroller.scrollTop = 100;
  scroller.getBoundingClientRect = () => ({top: 100, bottom: 560} as DOMRect);
  input.closest('.field')!.getBoundingClientRect = () => ({top: 160, bottom: 250, height: 90} as DOMRect);
  viewport.dispatchEvent(new Event('scroll')); flush();
  expect(root.style.getPropertyValue('--mobile-visible-top')).toBe('200px');
  expect(root.style.getPropertyValue('--mobile-workspace-height')).toBe('360px');
  expect(scroller.scrollTop).toBe(52);
});
test('closing the keyboard restores height; rotation back to desktop removes mobile overrides', () => {
  const {root, viewport, flush} = fixture();
  viewport.height = 350; viewport.dispatchEvent(new Event('resize')); flush();
  viewport.height = 800; viewport.dispatchEvent(new Event('resize')); flush();
  expect(root.style.getPropertyValue('--mobile-workspace-height')).toBe('700px');
  expect(root.style.getPropertyValue('--mobile-keyboard-space')).toBe('0px');
  vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1200);
  window.dispatchEvent(new Event('resize')); flush();
  expect(root.getAttribute('style')).toBe('');
});
test('Back/Next remains reachable when the keyboard is still panned after leaving a text field', () => {
  const {root, scroller, viewport, flush} = fixture();
  const next = document.createElement('button'); next.textContent = 'Next'; scroller.append(next);
  next.getBoundingClientRect = () => ({top: 430, bottom: 474, height: 44} as DOMRect);
  viewport.height = 360; viewport.offsetTop = 100; next.focus(); flush();
  expect(scroller.scrollTop).toBe(92);
  expect(root.style.getPropertyValue('--mobile-visible-top')).toBe('100px');
});
test('a tall evaluator notice scrolls out of the keyboard area only while a MAP input is being edited', () => {
  const {root, input, viewport, flush} = fixture();
  let top = 450;
  root.getBoundingClientRect = () => ({top} as DOMRect);
  const outerScroll = vi.spyOn(window, 'scrollBy').mockImplementation(() => {top = 8;});
  viewport.height = 360; viewport.dispatchEvent(new Event('resize')); flush();
  expect(outerScroll).not.toHaveBeenCalled();
  input.focus(); flush();
  expect(outerScroll).toHaveBeenCalledWith({top: 442, behavior: 'auto'});
  expect(root.style.getPropertyValue('--mobile-workspace-height')).toBe('352px');
});
test('older browsers without VisualViewport use the window height and remain scrollable', () => {
  const {root, flush} = fixture(); dispose!();
  Object.defineProperty(window, 'visualViewport', {configurable: true, value: undefined});
  vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(420);
  dispose = observeMobileViewport(root); window.dispatchEvent(new Event('resize')); flush();
  expect(root.style.getPropertyValue('--mobile-visible-height')).toBe('420px');
  expect(root.style.getPropertyValue('--mobile-workspace-height')).toBe('320px');
});
test('unmount removes viewport listeners, pending animation frames and overrides', () => {
  const {root, viewport, cancelled} = fixture();
  viewport.dispatchEvent(new Event('resize')); dispose!(); dispose = undefined;
  expect(cancelled).toHaveBeenCalledWith(1);
  // Cancelled RAF does not run in a real browser; ensure events no longer schedule one.
  const raf = vi.mocked(window.requestAnimationFrame); raf.mockClear();
  viewport.dispatchEvent(new Event('resize')); window.dispatchEvent(new Event('resize'));
  expect(raf).not.toHaveBeenCalled(); expect(root.getAttribute('style')).toBe('');
});

function watchPaneResize() {
  let resize: (() => void) | undefined;
  const observed: Element[] = [], disconnect = vi.fn();
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { resize = callback; }
    observe(element: Element) { observed.push(element); }
    disconnect = disconnect;
  });
  return {resize: () => {expect(resize).toBeTypeOf('function'); resize!();}, observed, disconnect};
}
test('a review pane resize re-reveals the focused field without another viewport event', () => {
  const observer = watchPaneResize();
  const {scroller, field, input, flush} = fixture();
  field.getBoundingClientRect = () => ({top:410-scroller.scrollTop,bottom:500-scroller.scrollTop,height:90} as DOMRect);
  input.focus(); flush(); expect(scroller.scrollTop).toBe(118);
  scroller.getBoundingClientRect = () => ({top:150,bottom:300} as DOMRect);
  observer.resize(); expect(scroller.scrollTop).toBe(208);
  expect(observer.observed).toContain(scroller);
  dispose!(); dispose=undefined; expect(observer.disconnect).toHaveBeenCalledOnce();
});
test('a panned keyboard keeps a tall textarea visible after the review changes size', () => {
  const observer = watchPaneResize();
  const {scroller, field, input, viewport, flush} = fixture();
  viewport.height=360; viewport.offsetTop=100;
  field.getBoundingClientRect = () => ({top:410-scroller.scrollTop,bottom:710-scroller.scrollTop,height:300} as DOMRect);
  input.getBoundingClientRect = () => ({top:430-scroller.scrollTop,bottom:534-scroller.scrollTop,height:104} as DOMRect);
  scroller.getBoundingClientRect = () => ({top:150,bottom:400} as DOMRect);
  input.focus(); flush(); expect(scroller.scrollTop).toBe(142);
  scroller.getBoundingClientRect = () => ({top:160,bottom:300} as DOMRect);
  observer.resize(); expect(scroller.scrollTop).toBe(242);
});
