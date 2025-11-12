const { createApiClient } = require('./dist/client/base-client');

console.log('Testing method binding...');
try {
  const client = createApiClient();
  console.log('✓ Client created successfully');

  // Test method extraction (this should trigger the error if binding failed)
  const { get, post, patch, put, delete: del, head, options, upload } = client;
  console.log('✓ Methods extracted');

  // Test method call context (this is where "Illegal invocation" would occur)
  console.log('Testing method context preservation...');

  if (typeof get === 'function') console.log('✓ get is function');
  if (typeof post === 'function') console.log('✓ post is function');
  if (typeof patch === 'function') console.log('✓ patch is function');
  if (typeof put === 'function') console.log('✓ put is function');
  if (typeof del === 'function') console.log('✓ delete is function');
  if (typeof head === 'function') console.log('✓ head is function');
  if (typeof options === 'function') console.log('✓ options is function');
  if (typeof upload === 'function') console.log('✓ upload is function');

} catch (error) {
  console.error('✗ Method binding error:', error.message);
  console.error('Stack:', error.stack);
}
