const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { FrameworkClient } = require('../src/client');
const { handleCommand } = require('../src/handlers/commandHandler');
const registerCommands = require('../src/registry/registerCommands');
const areCommandsDifferent = require('../src/utils/areCommandsDifferent');

const interaction = (overrides = {}) => ({
  commandName: 'ping',
  user: { id: 'user-1' },
  guild: {},
  member: { roles: { cache: { some: () => false } } },
  replied: false,
  deferred: false,
  reply: async function (payload) {
    this.replied = true;
    this.replyPayload = payload;
  },
  ...overrides,
});

const baseClient = (overrides = {}) => ({
  commandCooldowns: new Map(),
  config: { devUserIds: [] },
  ...overrides,
});

const withoutConsoleOutput = async (callback) => {
  const originalLog = console.log;
  const originalError = console.error;
  console.log = () => {};
  console.error = () => {};

  try {
    return await callback();
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
};

test('stores built-in command settings', () => {
  const client = new FrameworkClient({ builtInCommands: { status: false } });
  assert.equal(client.config.builtInCommands.status, false);
});

describe('handleCommand', () => {
  test('unknown command is a no-op', async () => {
    const i = interaction({ commandName: 'nope' });
    await handleCommand(baseClient(), i, new Map());
    assert.equal(i.replied, false);
  });

  test('devOnly blocks non-devs, allows devs', async () => {
    let called = 0;
    const commands = new Map([['secret', { name: 'secret', devOnly: true, callback: async () => { called++; } }]]);

    const blocked = interaction({ commandName: 'secret' });
    await handleCommand(baseClient({ config: { devUserIds: ['dev-1'] } }), blocked, commands);
    assert.equal(called, 0);
    assert.match(blocked.replyPayload.content, /Developers only/);

    await handleCommand(baseClient({ config: { devUserIds: ['user-1'] } }), interaction({ commandName: 'secret' }), commands);
    assert.equal(called, 1);
  });

  test('DMs blocked by default, allowed with restrictDMs: false', async () => {
    let called = 0;
    const commands = new Map([['ping', { name: 'ping', callback: async () => { called++; } }]]);
    const dmOff = new Map([['ping', { name: 'ping', restrictDMs: false, callback: async () => { called++; } }]]);

    const blocked = interaction({ guild: null });
    await handleCommand(baseClient(), blocked, commands);
    assert.equal(called, 0);
    assert.match(blocked.replyPayload.content, /Direct Messages/);

    await handleCommand(baseClient(), interaction({ guild: null }), dmOff);
    assert.equal(called, 1);
  });

  test('permissionsRequired blocks without the role, allows with it', async () => {
    let called = 0;
    const commands = new Map([['admin', { name: 'admin', permissionsRequired: ['role-1'], callback: async () => { called++; } }]]);

    const blocked = interaction({ commandName: 'admin' }); // roles.cache.some() -> false
    await handleCommand(baseClient(), blocked, commands);
    assert.equal(called, 0);
    assert.match(blocked.replyPayload.content, /restricted to/);

    const allowed = interaction({ commandName: 'admin', member: { roles: { cache: { some: () => true } } } });
    await handleCommand(baseClient(), allowed, commands);
    assert.equal(called, 1);
  });

  test('permissionsRequired still blocks in DMs even with restrictDMs: false', async () => {
    let called = false;
    const commands = new Map([['admin', {
      name: 'admin',
      restrictDMs: false,
      permissionsRequired: ['role-1'],
      callback: async () => { called = true; },
    }]]);
    const i = interaction({ commandName: 'admin', guild: null, member: undefined });

    await handleCommand(baseClient(), i, commands);

    assert.equal(called, false);
    assert.match(i.replyPayload.content, /Direct Messages/);
  });

  test('cooldown blocks a second use', async () => {
    let calls = 0;
    const client = baseClient();
    const commands = new Map([['ping', { name: 'ping', cooldown: 1000, callback: async () => { calls++; } }]]);

    await handleCommand(client, interaction(), commands);
    const blocked = interaction();
    await handleCommand(client, blocked, commands);

    assert.equal(calls, 1);
    assert.match(blocked.replyPayload.content, /wait/);
  });

  test('callback throwing gives a generic reply, unless already replied', async () => {
    const throws = new Map([['boom', { name: 'boom', callback: async () => { throw new Error('nope'); } }]]);
    const i = interaction({ commandName: 'boom' });
    await withoutConsoleOutput(() => handleCommand(baseClient(), i, throws));
    assert.match(i.replyPayload.content, /error occurred/);

    const alreadyReplied = new Map([['boom', {
      name: 'boom',
      callback: async (_c, interaction) => { interaction.replied = true; throw new Error('nope'); },
    }]]);
    const i2 = interaction({ commandName: 'boom' });
    await withoutConsoleOutput(() => handleCommand(baseClient(), i2, alreadyReplied));
    assert.equal(i2.replyPayload, undefined);
  });
});

describe('registerCommands', () => {
  const mockApplicationCommands = (existing = []) => {
    const calls = { created: [], edited: [], deleted: [] };
    return {
      calls,
      commands: {
        cache: new Map(existing.map((cmd) => [cmd.name, cmd])),
        fetch: async () => {},
        create: async (data) => { calls.created.push(data); },
        edit: async (id, data) => { calls.edited.push({ id, data }); },
        delete: async (id) => { calls.deleted.push(id); },
      },
    };
  };

  test('creates new, edits changed, skips unchanged', async () => {
    const { commands, calls } = mockApplicationCommands([
      { id: 'ping-id', name: 'ping', description: 'old', options: [] },
      { id: 'pong-id', name: 'pong', description: 'same', options: [] },
    ]);

    await withoutConsoleOutput(() => registerCommands({ application: { commands } }, [
      { name: 'ping', description: 'new', options: [] },
      { name: 'pong', description: 'same', options: [] },
      { name: 'new-cmd', description: 'x' },
    ]));

    assert.deepEqual(calls.created, [{ name: 'new-cmd', description: 'x', options: [] }]);
    assert.equal(calls.edited.length, 1);
    assert.equal(calls.edited[0].id, 'ping-id');
  });

  test('deletes remote commands missing locally, and keeps going if one call fails', async () => {
    const { commands, calls } = mockApplicationCommands([
      { id: 'bad-id', name: 'bad', description: 'x', options: [] },
      { id: 'good-id', name: 'good', description: 'x', options: [] },
    ]);
    commands.delete = async (id) => {
      if (id === 'bad-id') throw new Error('discord is down');
      calls.deleted.push(id);
    };

    await withoutConsoleOutput(() => registerCommands({ application: { commands } }, []));

    assert.deepEqual(calls.deleted, ['good-id']);
  });
});

describe('areCommandsDifferent', () => {
  const cases = [
    ['identical', { description: 'x', options: [] }, { description: 'x', options: [] }, false],
    ['description changed', { description: 'old', options: [] }, { description: 'new', options: [] }, true],
    [
      'option count changed',
      { description: 'x', options: [{ name: 'a', description: 'a', type: 3 }] },
      { description: 'x', options: [] },
      true,
    ],
    [
      'option property changed',
      { description: 'x', options: [{ name: 'a', description: 'old', type: 3 }] },
      { description: 'x', options: [{ name: 'a', description: 'new', type: 3 }] },
      true,
    ],
    [
      'choice value changed',
      { description: 'x', options: [{ name: 'a', description: 'a', type: 3, choices: [{ name: 'one', value: 1 }] }] },
      { description: 'x', options: [{ name: 'a', description: 'a', type: 3, choices: [{ name: 'one', value: 99 }] }] },
      true,
    ],
  ];

  for (const [label, existing, local, expected] of cases) {
    test(label, () => {
      assert.equal(areCommandsDifferent(existing, local), expected);
    });
  }
});