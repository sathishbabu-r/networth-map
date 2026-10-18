export function testModeEnabled(command, mode, env) {
  const enabled = env.APP_TEST_MODE === '1' || env.VITE_APP_TEST_MODE === '1';
  if (enabled && (command !== 'serve' || mode !== 'development' || env.NODE_ENV === 'production')) {
    throw new Error('TEST MODE is local development only. Disable APP_TEST_MODE before building or deploying.');
  }
  return enabled;
}
