const fs = require('fs');

// Grab the environment variables from the process
// AZURE_CLIENT_ID
// AZURE_TENANT_ID (use 'organizations' if not available or null)
// Then, write an environment.ts file to:
// apps/ai/device/src/app/environment/environment.ts
// apps/rwt/device/src/app/environment/environment.ts

// If the envs don't exist, bail with an error
if (!process.env.AZURE_CLIENT_ID) {
  console.error('Please provide AZURE_CLIENT_ID and AZURE_TENANT_ID environment variables');
  process.exit(1);
}

const environment = `export const environment = {
  azure: {
    clientId: '${process.env.AZURE_CLIENT_ID}',
    tenantId: '${process.env.AZURE_TENANT_ID || 'organizations'}',
  },
  speech: {
    subscriptionKey: '${process.env.AZURE_SPEECH_KEY}',
    region: '${process.env.AZURE_SPEECH_REGION}',
  },
};
`;

fs.writeFileSync('apps/ai/device/src/app/environment/environment.ts', environment);
fs.writeFileSync('apps/rwt/device/src/app/environment/environment.ts', environment);
