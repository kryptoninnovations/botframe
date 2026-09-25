const test = require('node:test');
const assert = require('node:assert/strict');
const { FrameworkClient } = require('../src/client');
const { handleCommand } = require('../src/handlers/commandHandler');
const registerCommands = require('../src/registry/registerCommands');

const interaction = (commandName) => ({
  commandName,
  user: { id: 'user-1' },
  guild: {},
  replied: false,
  deferred: false,
  reply: async function (payload) {
    this.replyPayload = payload;
  },
});

test('stores built-in command settings in client options', () => {
  const client = new FrameworkClient({
    builtInCommands: { status: false },
  });

  assert.equal(client.config.builtInCommands.status, false);
});

test('applies command cooldowns per user', async () => {
  let calls = 0;
  const client = { commandCooldowns: new Map(), config: { devUserIds: [] } };
  const command = {
    name: 'ping',
    cooldown: 1000,
    callback: async () => { calls++; },
  };
  const commands = new Map([['ping', command]]);

  await handleCommand(client, interaction('ping'), commands);
  const blocked = interaction('ping');
  await handleCommand(client, blocked, commands);

  assert.equal(calls, 1);
  assert.match(blocked.replyPayload.content, /wait/);
});

test('deletes commands missing from the local command list', async () => {
  const deleted = [];
  const commands = {
    cache: new Map([['old', { id: 'old-id', name: 'old' }]]),
    fetch: async () => {},
    delete: async id => deleted.push(id),
  };

  await registerCommands({ application: { commands } }, []);

  assert.deepEqual(deleted, ['old-id']);
});
