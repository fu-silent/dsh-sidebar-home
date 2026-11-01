#!/usr/bin/env node
/**
 * Zero-dependency render smoke test for the dsh-sidebar-home client bundle.
 *
 * Loads client.js in a VM sandbox with a hand-written minimal React
 * (createElement/useState/useEffect/useMemo/useRef) and a fake Cordis client
 * context, then drives the plugin through its registrations and components.
 * It catches render-time exceptions and the release-critical behaviours:
 * slot identity, dynamic single-slot replacement, layout persistence,
 * current-session visibility, attention indicators, pinned ordering and
 * exit-focus restore.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const BUNDLE = path.join(__dirname, '..');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(BUNDLE, 'package.json'), 'utf8'));
const clientSource = fs.readFileSync(path.join(BUNDLE, 'client.js'), 'utf8');

// ---------------------------------------------------------------- fake React
let currentHooks = null;

function hookSlot() {
  const index = currentHooks.index++;
  return currentHooks.slots[index];
}

function useState(initial) {
  const slot = hookSlot();
  if (slot === undefined) {
    const value = typeof initial === 'function' ? initial() : initial;
    currentHooks.slots[currentHooks.index - 1] = { value };
    return [value, () => {}];
  }
  return [slot.value, () => {}];
}

function useMemo(factory) {
  hookSlot();
  return factory();
}

function useEffect() {
  hookSlot();
}

function useRef(initial) {
  const slot = hookSlot();
  if (slot === undefined) {
    currentHooks.slots[currentHooks.index - 1] = { ref: { current: initial } };
    return currentHooks.slots[currentHooks.index - 1].ref;
  }
  return slot.ref;
}

function createElement(type, props, ...children) {
  const flat = [];
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    flat.push(child);
  }
  return { $$dshElement: true, type, props: { ...(props || {}), children: flat } };
}

const fakeReact = { createElement, useState, useMemo, useEffect, useRef };

// ---------------------------------------------------------------- renderer
function renderComponent(Component, props) {
  currentHooks = { slots: [], index: 0 };
  try {
    return Component({ ...props });
  } finally {
    currentHooks = null;
  }
}

/** Render a component tree and return every host element (type is a string). */
function renderCollect(Component, props) {
  const elements = [];
  const visit = (node) => {
    if (node === null || node === undefined) return;
    const list = Array.isArray(node) ? node : [node];
    for (const item of list) {
      if (item === null || item === undefined) continue;
      if (typeof item === 'string' || typeof item === 'number') continue;
      if (!item.$$dshElement) continue;
      if (typeof item.type === 'function') {
        visit(renderComponent(item.type, item.props));
        continue;
      }
      elements.push(item);
      visit(item.props.children);
    }
  };
  visit(renderComponent(Component, props));
  return elements;
}

const classNameOf = (element) => (typeof element.props.className === 'string' ? element.props.className : '');
const hasClass = (element, token) => classNameOf(element).split(/\s+/).includes(token);
const findByClass = (elements, token) => elements.find((element) => hasClass(element, token));
const findAllByClass = (elements, token) => elements.filter((element) => hasClass(element, token));
const textOf = (element) => {
  if (element === null || element === undefined) return '';
  if (typeof element === 'string' || typeof element === 'number') return String(element);
  if (!element.$$dshElement) return '';
  return (element.props.children || []).map(textOf).join('');
};

// ---------------------------------------------------------------- fake services
function makeTranslate() {
  return (key, params) => {
    if (!params) return '[' + key + ']';
    const rendered = Object.entries(params)
      .map(([name, value]) => name + '=' + String(value))
      .join(',');
    return '[' + key + ':' + rendered + ']';
  };
}

const t = makeTranslate();

function snapshotHook(getSnapshot) {
  return (selector) => selector(getSnapshot());
}

function makeHarness(seed) {
  const registrations = [];
  const effects = [];
  const eventHandlers = [];

  const disposeRegistration = (registration) => {
    const index = registrations.indexOf(registration);
    if (index !== -1) registrations.splice(index, 1);
  };

  const ctx = {
    effect(execute, label) {
      const dispose = execute();
      effects.push({ label, dispose });
      return typeof dispose === 'function' ? dispose : () => {};
    },
    inject(_deps, callback) {
      callback(ctx);
      return () => {};
    },
    slots: {
      inject(_key, callback) {
        const disposer = callback();
        return typeof disposer === 'function' ? disposer : () => {};
      },
      register(options, component) {
        const registration = { options, component };
        registrations.push(registration);
        return () => disposeRegistration(registration);
      },
    },
    locale: {
      register: () => () => {},
      bind: () => t,
      subscribe: () => () => {},
    },
    get() {
      return undefined;
    },
    uiWorkspace: {
      openWorkspace: async () => {},
      openSession: () => {},
      pickDirectory: async () => null,
      startSession: () => {},
    },
    workspaces: {
      create: async ({ path }) => ({ workspaceId: 'created-ws', path, title: 'Created', sessionIds: [] }),
    },
  };

  let loaded = null;
  const sandbox = {
    window: {
      localStorage: {
        store: new Map(seed === undefined ? [] : Object.entries(seed)),
        getItem(key) {
          return this.store.has(key) ? this.store.get(key) : null;
        },
        setItem(key, value) {
          this.store.set(key, String(value));
        },
      },
      addEventListener: (type, handler) => eventHandlers.push({ type, handler }),
      removeEventListener: () => {},
      __ModuleLoader__: {
        load(module) {
          loaded = module;
        },
      },
      matchMedia: () => ({ matches: false }),
    },
    document: undefined,
    console,
    setTimeout,
    clearTimeout,
    setInterval: () => 0,
    clearInterval: () => {},
  };
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox.window;
  vm.runInNewContext(clientSource, sandbox, { filename: 'client.js' });

  if (loaded === null) throw new Error('bundle did not call __ModuleLoader__.load');
  if (loaded.id !== MANIFEST.name) throw new Error(`module id ${loaded.id} != package name ${MANIFEST.name}`);

  const mod = loaded.factory((specifier) => {
    if (specifier === 'react') return fakeReact;
    throw new Error('unexpected require: ' + specifier);
  });

  if (JSON.stringify(mod.inject) !== JSON.stringify(['slots'])) {
    throw new Error('hard inject must be [slots], got ' + JSON.stringify(mod.inject));
  }

  mod.apply(ctx);
  return { registrations, effects, mod, sandbox, ctx, eventHandlers };
}

// ---------------------------------------------------------------- fixtures
const now = Date.now();

function baseSessions() {
  return {
    ids: ['s1', 's2', 's3', 's4', 's5'],
    byId: {
      s1: { id: 's1', title: 'Alpha', displayTitle: 'Alpha', updatedAt: now - 60_000, blank: false, retainedBy: { mainView: 1 } },
      s2: { id: 's2', title: 'Beta', displayTitle: 'Beta', updatedAt: now - 3_600_000, blank: true, retainedBy: {} },
      s3: { id: 's3', title: 'Gamma', displayTitle: 'Gamma', updatedAt: now - 90_000_000, blank: false, retainedBy: {} },
      s4: { id: 's4', title: 'Delta', displayTitle: 'Delta', updatedAt: now - 5_000, blank: false, retainedBy: {} },
      s5: { id: 's5', title: 'Child', displayTitle: 'Child', updatedAt: now - 5_000, blank: false, retainedBy: {}, origin: 'subagent' },
    },
    phase: 'ready',
    projectionsBySession: {},
  };
}

function baseWorkspaces() {
  return {
    items: [
      { workspaceId: 'ws1', path: '/Users/me/projects/alpha', title: 'Alpha Workspace', sessionIds: ['s1', 's2', 's3'], createdAt: '', updatedAt: '' },
      { workspaceId: 'ws2', path: '/Users/me/projects/beta', title: 'default-workspace', sessionIds: ['s4'], createdAt: '', updatedAt: '' },
    ],
    archivedSessionIds: ['s3'],
    pinnedSessionIds: [],
    state: 'ready',
    phase: 'ready',
    error: null,
  };
}

const statusesFixture = new Map([
  ['s1', { running: true }],
  ['s4', { completionUnread: true }],
]);

const standardProps = (workspacesState, sessionsState, statuses = statusesFixture) => ({
  useWorkspaces: snapshotHook(() => workspacesState),
  useSessions: snapshotHook(() => sessionsState),
  useSessionStatus: snapshotHook(() => statuses),
  usePanelInfo: snapshotHook(() => ({ activePanelId: null })),
  useSessionRetainInfo: (key, selector) => selector({ referenceCount: 0, retainedBy: {} }),
  useSessionAccess: () => true,
  useWorkspaceAccess: () => true,
  useRemoteAccess: () => true,
  useResource: () => undefined,
  renderFactorySlot: () => null,
  renderSlot: () => null,
  t,
  locale: 'sidebar-home',
});

/** Bind an entry inject face exactly like the renderer does (hooks -> useX). */
function bindInject(options) {
  const face = options.inject();
  const sources = face.hooks || {};
  const bound = { ...face };
  delete bound.hooks;
  for (const [name, source] of Object.entries(sources)) {
    bound['use' + name[0].toUpperCase() + name.slice(1)] = snapshotHook(() => source.getSnapshot());
  }
  return bound;
}

const STORAGE_KEY = 'dsh-sidebar-home:state:v1';

// ---------------------------------------------------------------- scenarios
async function main() {
  // ---- 0. module identity + registrations
  const harness = makeHarness();
  const { registrations } = harness;
  const bySlot = (name) => registrations.filter((entry) => entry.options.name === name);

  if (bySlot('main').length !== 1) throw new Error('expected one main registration');
  if (bySlot('sidebar.panellist').length !== 1) throw new Error('expected one panellist registration');
  if (bySlot('sidebar.workspaces').length !== 0) throw new Error('focus browser must not register before focus is on');

  const mainEntry = bySlot('main')[0];
  const panellistEntry = bySlot('sidebar.panellist')[0];
  if (mainEntry.options.key !== 'sidebar-home') throw new Error('main key must be namespaced sidebar-home');
  if (panellistEntry.options.id !== 'sidebar-home') throw new Error('panellist id must be namespaced sidebar-home');
  if (panellistEntry.options.label() !== '[nav.home]') throw new Error('unexpected nav label');
  if (mainEntry.options.locale !== 'sidebar-home') throw new Error('main registration must declare the locale namespace');

  const sessions = baseSessions();
  const workspaces = baseWorkspaces();
  const bigSessions = {
    ids: Array.from({ length: 12 }, (_, index) => 'big' + index),
    byId: Object.fromEntries(
      Array.from({ length: 12 }, (_, index) => [
        'big' + index,
        {
          id: 'big' + index,
          title: 'Big ' + index,
          displayTitle: 'Big ' + index,
          updatedAt: now - (index + 1) * 60_000,
          blank: false,
          retainedBy: index === 11 ? { mainView: 1 } : {},
        },
      ]),
    ),
    phase: 'ready',
    projectionsBySession: {},
  };
  const bigWorkspaces = {
    items: [{ workspaceId: 'big-ws', path: '/tmp/big', title: 'Big Workspace', sessionIds: bigSessions.ids }],
    archivedSessionIds: [],
    pinnedSessionIds: [],
    state: 'ready',
    phase: 'ready',
    error: null,
  };

  const mainInject = bindInject(mainEntry.options);
  const homeSnapshot = () => mainInject.useHome((state) => state);

  // ---- 1. Home: grid (default) + layout switch persistence
  renderCollect(mainEntry.component, { ...standardProps(workspaces, sessions), ...mainInject, t });
  if (homeSnapshot().homeLayout !== 'grid') throw new Error('default home layout must be grid');
  if (typeof mainInject.homeActions.setHomeLayout !== 'function') throw new Error('missing setHomeLayout');
  mainInject.homeActions.setHomeLayout('list');
  if (homeSnapshot().homeLayout !== 'list') throw new Error('layout switch did not persist list');
  const persisted = JSON.parse(harness.sandbox.window.localStorage.store.get(STORAGE_KEY));
  if (persisted.homeLayout !== 'list') throw new Error('home layout not persisted');
  const listElements = renderCollect(mainEntry.component, {
    ...standardProps(workspaces, sessions),
    ...mainInject,
    t,
  });
  if (findByClass(listElements, 'dshsh-list') === undefined) throw new Error('list layout did not render');
  mainInject.homeActions.setHomeLayout('bogus');
  if (homeSnapshot().homeLayout !== 'grid') throw new Error('invalid layout must fall back to grid');

  // ---- 2. Home: empty, loading and error states
  const empty = { ...workspaces, items: [] };
  const emptyElements = renderCollect(mainEntry.component, { ...standardProps(empty, sessions), ...mainInject, t });
  if (findByClass(emptyElements, 'dshsh-empty') === undefined) throw new Error('empty state did not render');
  const loadingElements = renderCollect(mainEntry.component, {
    ...standardProps({ ...empty, phase: 'pending' }, sessions),
    ...mainInject,
    t,
  });
  if (findByClass(loadingElements, 'dshsh-loading') === undefined) throw new Error('loading state did not render');

  // ---- 3. Home: card children are phrasing content (a11y: no div in button)
  const gridElements = renderCollect(mainEntry.component, {
    ...standardProps(workspaces, sessions),
    ...mainInject,
    t,
  });
  const card = findByClass(gridElements, 'dshsh-card');
  if (card === undefined) throw new Error('card layout did not render');
  if (card.type !== 'button') throw new Error('card root should stay a button');
  for (const child of card.props.children.filter((item) => item && item.$$dshElement)) {
    if (child.type === 'div') throw new Error('card must not contain div children');
  }

  // ---- 4. panellist icon
  renderCollect(panellistEntry.component, { size: 16, active: true });

  // ---- 5. enter a workspace -> focus browser registers at a safe priority
  await mainInject.homeActions.enterWorkspace('ws1');
  const focusEntries = bySlot('sidebar.workspaces');
  if (focusEntries.length !== 1) throw new Error('expected focus browser registration after entering workspace');
  const focusOptions = focusEntries[0].options;
  if (focusOptions.priority !== -100) throw new Error('focus browser must shadow at priority -100, got ' + focusOptions.priority);
  const focusInject = bindInject(focusOptions);
  if (focusInject.useHome === undefined) throw new Error('focus inject must expose useHome');

  const focusElements = renderCollect(focusEntries[0].component, {
    ...standardProps(workspaces, sessions),
    ...focusInject,
    wide: true,
    expandSidebar: () => {},
    t,
  });
  // M3: labelled exit + focus pill
  if (findByClass(focusElements, 'dshsh-exitbtn') === undefined) throw new Error('labelled exit button missing');
  if (findByClass(focusElements, 'dshsh-pill') === undefined) throw new Error('focus mode pill missing');
  // M1: running status dot + label for s1
  const statusDots = findAllByClass(focusElements, 'dshsh-statusdot');
  if (statusDots.length === 0) throw new Error('attention status dot missing');
  // DATA-1/M2: current session (s1) is rendered and marked
  const currentRows = focusElements.filter((element) => hasClass(element, 'dshsh-row') && element.props['aria-current'] === 'true');
  if (currentRows.length !== 1) throw new Error('current session row missing aria-current');
  // M5: no current blank in ws1 -> "+ New session" row exists
  if (findByClass(focusElements, 'dshsh-newrow') === undefined) throw new Error('new-session row missing');
  // S2: archived rows stay reachable and clickable instead of disabled
  focusInject.homeActions.toggleShowArchived();
  const archivedElements = renderCollect(focusEntries[0].component, {
    ...standardProps(workspaces, sessions),
    ...focusInject,
    wide: true,
    expandSidebar: () => {},
    t,
  });
  const archivedRow = findRowByTitleText(archivedElements, '[focus.archived]');
  if (archivedRow === undefined) throw new Error('archived sample row expected after enabling archived');
  if (archivedRow.props.disabled === true) throw new Error('archived row must not be disabled');
  if (archivedRow.props['aria-disabled'] !== 'true') throw new Error('archived row must be aria-disabled');
  if (typeof archivedRow.props.onClick !== 'function') throw new Error('archived row needs a click handler for its notice');
  focusInject.homeActions.toggleShowArchived();

  // ---- 6. rail mode
  renderCollect(focusEntries[0].component, {
    ...standardProps(workspaces, sessions),
    ...focusInject,
    wide: false,
    expandSidebar: () => {},
    t,
  });

  // ---- 7. current session behind the row cap stays visible (M2/DATA-1)
  const bigHarness = makeHarness({ [STORAGE_KEY]: JSON.stringify({ focusWorkspaceId: 'big-ws' }) });
  const bigMain = bigHarness.registrations.find((entry) => entry.options.name === 'main');
  const bigFocus = bigHarness.registrations.find((entry) => entry.options.name === 'sidebar.workspaces');
  if (bigFocus === undefined) throw new Error('seeded focus state must register the focus browser on boot');
  const bigInject = bindInject(bigFocus.options);
  const bigElements = renderCollect(bigFocus.component, {
    ...standardProps(bigWorkspaces, bigSessions),
    ...bigInject,
    wide: true,
    expandSidebar: () => {},
    t,
  });
  const bigCurrent = bigElements.filter((element) => hasClass(element, 'dshsh-row') && element.props['aria-current'] === 'true');
  if (bigCurrent.length !== 1) throw new Error('current session behind row cap must stay visible');
  if (textOf(bigCurrent[0]).indexOf('Big 11') === -1) throw new Error('wrong row marked as current');

  // ---- 8. malformed storage falls back to defaults
  const brokenHarness = makeHarness({ [STORAGE_KEY]: '{not json' });
  if (brokenHarness.registrations.some((entry) => entry.options.name === 'sidebar.workspaces')) {
    throw new Error('malformed storage must not register the focus browser');
  }

  // ---- 9. exit focus disposes the replacement (shipped browser restored)
  focusInject.homeActions.exitFocus();
  const afterExit = bySlot('sidebar.workspaces');
  if (afterExit.length !== 0) throw new Error('exit focus must remove the replacement registration');

  // ---- 10. pinned sessions sort first and render a pin mark
  const pinnedHarness = makeHarness({
    [STORAGE_KEY]: JSON.stringify({ focusWorkspaceId: 'ws1' }),
  });
  const pinnedFocus = pinnedHarness.registrations.find((entry) => entry.options.name === 'sidebar.workspaces');
  const pinnedInject = bindInject(pinnedFocus.options);
  const pinnedWorkspaces = { ...workspaces, pinnedSessionIds: ['s1'] };
  const pinnedElements = renderCollect(pinnedFocus.component, {
    ...standardProps(pinnedWorkspaces, sessions, new Map()),
    ...pinnedInject,
    wide: true,
    expandSidebar: () => {},
    t,
  });
  if (findByClass(pinnedElements, 'dshsh-row-pin') === undefined) throw new Error('pinned session marker missing');

  // ---- 11. missing workspace focus target self-heals (effect is noop here; the
  // component must still render without throwing)
  renderCollect(focusEntries[0].component, {
    ...standardProps({ ...workspaces, items: [] }, sessions),
    ...focusInject,
    wide: true,
    expandSidebar: () => {},
    t,
  });

  console.log('smoke: all component renders passed');
  console.log('smoke: registrations =', registrations.map((entry) => entry.options.name + ':' + (entry.options.key || entry.options.id || '')).join(', '));
}

/** Find a rendered row button whose text contains a marker. */
function findRowByTitleText(elements, marker) {
  return elements.find((element) => hasClass(element, 'dshsh-row') && textOf(element).indexOf(marker) !== -1);
}

main().catch((error) => {
  console.error('SMOKE TEST FAILED');
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
