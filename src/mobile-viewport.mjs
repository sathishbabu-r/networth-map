// Keep the mobile workspace inside the visible screen, including when a keyboard
// shrinks only VisualViewport (not the layout viewport). No financial state here.
export function observeMobileViewport(workspace) {
  const doc = workspace.ownerDocument, win = doc.defaultView;
  const viewport = win.visualViewport;
  const properties = ['--mobile-visible-height', '--mobile-visible-top', '--mobile-workspace-height', '--mobile-keyboard-space'];
  let frame;
  function update() {
    frame = undefined;
    if (win.innerWidth > 640) {
      properties.forEach(key => workspace.style.removeProperty(key));
      return;
    }
    const top = viewport?.offsetTop ?? 0, height = viewport?.height ?? win.innerHeight;
    const bottom = top + height;
    // Leave scroll room behind an overlay keyboard, even if the layout viewport
    // did not shrink. The gap disappears as soon as the keyboard closes.
    workspace.style.setProperty('--mobile-keyboard-space', `${Math.max(0, win.innerHeight - height)}px`);
    const input = doc.activeElement;
    const focusedControl = workspace.contains(input) && input.matches('input, textarea, select, button');
    // The evaluator notice can leave the whole workspace below the keyboard.
    // Only scroll the outer page for a focused form/navigation control, never
    // during ordinary reading.
    const workspaceTop = workspace.getBoundingClientRect().top;
    if (focusedControl && input.closest('.replica-pane') && workspaceTop > top + 8 && (height < 500 || workspaceTop > top + height / 2)) {
      workspace.style.setProperty('--mobile-workspace-height', `${height}px`);
      win.scrollBy({top: workspaceTop - top - 8, behavior: 'auto'});
    }
    workspace.style.setProperty('--mobile-visible-height', `${height}px`);
    workspace.style.setProperty('--mobile-visible-top', `${top}px`);
    workspace.style.setProperty('--mobile-workspace-height', `${Math.max(120, bottom - Math.max(top, workspace.getBoundingClientRect().top))}px`);

    revealFocusedControl();
  }
  // Review/saving UI can resize the form after the keyboard event has finished.
  // Reveal the current control again against the latest layout, without changing
  // workspace dimensions inside ResizeObserver or interrupting manual scrolling.
  function revealFocusedControl() {
    if (win.innerWidth > 640) return;
    const input = doc.activeElement;
    if (!workspace.contains(input) || !input.matches('input, textarea, select, button')) return;
    const scroller = input.closest('.original-map-scroll');
    if (!scroller) return; // The Coach composer uses its own scrollable panel.
    const top = viewport?.offsetTop ?? 0;
    const bottom = top + (viewport?.height ?? win.innerHeight);
    const bounds = scroller.getBoundingClientRect();
    const visibleTop = Math.max(top, bounds.top) + 8;
    const visibleBottom = Math.min(bottom, bounds.bottom) - 8;
    if (visibleBottom <= visibleTop) return;
    const field = input.closest('.field, [role=group]') ?? input;
    const target = field.getBoundingClientRect().height <= visibleBottom - visibleTop ? field : input;
    const rect = target.getBoundingClientRect();
    if (rect.bottom > visibleBottom) scroller.scrollTop += rect.bottom - visibleBottom;
    else if (rect.top < visibleTop) scroller.scrollTop += rect.top - visibleTop;
  }

  function schedule() {
    if (frame === undefined) frame = win.requestAnimationFrame(update);
  }
  win.addEventListener('resize', schedule);
  win.addEventListener('scroll', schedule, { passive: true });
  viewport?.addEventListener('resize', schedule);
  viewport?.addEventListener('scroll', schedule);
  workspace.addEventListener('focusin', schedule);
  const geometryObserver = typeof win.ResizeObserver === 'function'
    ? new win.ResizeObserver(revealFocusedControl) : null;
  geometryObserver?.observe(workspace);
  const mapScroller = workspace.querySelector('.original-map-scroll');
  if (mapScroller) geometryObserver?.observe(mapScroller);
  update();
  return () => {
    geometryObserver?.disconnect();
    if (frame !== undefined) win.cancelAnimationFrame(frame);
    win.removeEventListener('resize', schedule);
    win.removeEventListener('scroll', schedule);
    viewport?.removeEventListener('resize', schedule);
    viewport?.removeEventListener('scroll', schedule);
    workspace.removeEventListener('focusin', schedule);
    properties.forEach(key => workspace.style.removeProperty(key));
  };
}
