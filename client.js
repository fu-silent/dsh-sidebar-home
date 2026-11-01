window.__ModuleLoader__.load({
  id: 'dsh-sidebar-home',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useMemo, useRef } = React;

    /** Locale namespace owned by this plugin. */
    const NS = 'sidebar-home';
    /** Panellist cell id == main keyed slot key. */
    const PANEL_ID = 'sidebar-home';
    /** Ascending order among sidebar panel icons; ships above the built-ins. */
    const PANEL_ORDER = -10;
    /** Browser-local persistence for the focus session. */
    const STORAGE_KEY = 'dsh-sidebar-home:state:v1';
    /** Show this many rows before offering "show the rest". */
    const ROW_LIMIT = 8;
    /** Cap the folded "other workspaces" list; the rest stays one click away in Home. */
    const OTHERS_LIMIT = 8;

    // #region locale dictionaries
    /** Simplified Chinese dictionary. */
    const zh = {
      'nav.home': '主页',
      'home.title': '主页',
      'home.subtitle': '选择一个工作区进入。进入后左侧栏只显示该工作区的聊天，其他工作区折叠在左下角。',
      'home.addWorkspace': '添加工作区',
      'home.adding': '正在选择目录…',
      'home.view.label': '主页布局',
      'home.view.grid': '卡片视图',
      'home.view.list': '列表视图',
      'home.empty.title': '还没有工作区',
      'home.empty.body': '添加一个文件夹作为工作区，然后就可以进入它开始聊天。',
      'home.loading': '正在载入工作区…',
      'home.error.workspaces': '工作区列表加载失败：{message}',
      'home.card.sessions.one': '{n} 个会话',
      'home.card.sessions.other': '{n} 个会话',
      'home.card.noSessions': '暂无会话',
      'home.card.lastActive': '最近活动 {t}',
      'home.card.archived.one': '{n} 个已归档',
      'home.card.archived.other': '{n} 个已归档',
      'home.focus.active': '专注中',
      'home.focus.banner': '正在专注「{title}」',
      'home.focus.hint': '左侧栏当前只显示该工作区的聊天。',
      'home.exitFocus': '退出专注',
      'home.error.add': '添加工作区失败：{message}',
      'home.error.open': '打开工作区失败：{message}',
      'workspace.defaultName': '默认工作区',
      'focus.backHome': '返回主页',
      'focus.exit': '退出专注',
      'focus.search.placeholder': '搜索当前工作区的会话',
      'focus.search.clear': '清除搜索',
      'focus.empty': '当前工作区还没有会话',
      'focus.noMatches': '没有匹配的会话',
      'focus.archived': '已归档',
      'focus.showArchived': '显示已归档',
      'focus.hideArchived': '隐藏已归档',
      'focus.archivedHint': '已归档会话，取消归档后才能打开',
      'focus.others': '其他工作区',
      'focus.others.count': '{n}',
      'focus.others.enter': '进入该工作区',
      'focus.others.all': '查看全部工作区',
      'focus.mode': '专注',
      'focus.loading': '正在载入…',
      'focus.status.approval': '待审批',
      'focus.status.planReview': '计划待审',
      'focus.status.question': '待回答',
      'focus.status.running': '进行中',
      'focus.status.done': '已完成',
      'focus.pinned': '已置顶',
      'focus.newSessionRow': '新会话',
      'focus.notice.archived': '已归档会话，取消归档后才能打开',
      'focus.search.count': '{visible}/{total}',
      'focus.search.scope': '只在当前工作区搜索；退出专注可全局搜索',
      'focus.showMore': '展开其余 {n} 个会话',
      'focus.showLess': '收起',
      'focus.untitled': '未命名',
      'focus.newSession': '新会话',
      'focus.rail': '展开侧边栏',
      'time.now': '刚刚',
      'time.minutes': '{n}分钟',
      'time.hours': '{n}小时',
      'time.days': '{n}天',
      'time.months': '{n}个月',
      'time.years': '{n}年',
    };
    /** English dictionary (fallback). */
    const en = {
      'nav.home': 'Home',
      'home.title': 'Home',
      'home.subtitle': 'Pick a workspace to enter. The sidebar then shows only its chats; other workspaces fold away at the bottom left.',
      'home.addWorkspace': 'Add workspace',
      'home.adding': 'Choosing a folder…',
      'home.view.label': 'Home layout',
      'home.view.grid': 'Card view',
      'home.view.list': 'List view',
      'home.empty.title': 'No workspaces yet',
      'home.empty.body': 'Add a folder as a workspace, then enter it to start chatting.',
      'home.loading': 'Loading workspaces…',
      'home.error.workspaces': 'Could not load workspaces: {message}',
      'home.card.sessions.one': '{n} session',
      'home.card.sessions.other': '{n} sessions',
      'home.card.noSessions': 'No sessions',
      'home.card.lastActive': 'Active {t}',
      'home.card.archived.one': '{n} archived',
      'home.card.archived.other': '{n} archived',
      'home.focus.active': 'Focused',
      'home.focus.banner': 'Focused on "{title}"',
      'home.focus.hint': 'The sidebar currently shows only this workspace.',
      'home.exitFocus': 'Exit focus',
      'home.error.add': 'Could not add workspace: {message}',
      'home.error.open': 'Could not open workspace: {message}',
      'workspace.defaultName': 'Default Workspace',
      'focus.backHome': 'Home',
      'focus.exit': 'Exit focus',
      'focus.search.placeholder': 'Search this workspace',
      'focus.search.clear': 'Clear search',
      'focus.empty': 'No sessions in this workspace yet',
      'focus.noMatches': 'No matching sessions',
      'focus.archived': 'Archived',
      'focus.showArchived': 'Show archived',
      'focus.hideArchived': 'Hide archived',
      'focus.archivedHint': 'Archived session — unarchive it before opening',
      'focus.others': 'Other workspaces',
      'focus.others.count': '{n}',
      'focus.others.enter': 'Enter this workspace',
      'focus.others.all': 'View all workspaces',
      'focus.mode': 'Focus',
      'focus.loading': 'Loading…',
      'focus.status.approval': 'Waiting approval',
      'focus.status.planReview': 'Plan review',
      'focus.status.question': 'Waiting answer',
      'focus.status.running': 'Running',
      'focus.status.done': 'Completed',
      'focus.pinned': 'Pinned',
      'focus.newSessionRow': 'New session',
      'focus.notice.archived': 'Archived session — unarchive it before opening',
      'focus.search.count': '{visible}/{total}',
      'focus.search.scope': 'Searches this workspace only; exit focus for global search',
      'focus.showMore': 'Show {n} more',
      'focus.showLess': 'Show less',
      'focus.untitled': 'Untitled',
      'focus.newSession': 'New session',
      'focus.rail': 'Expand sidebar',
      'time.now': 'now',
      'time.minutes': '{n}min',
      'time.hours': '{n}h',
      'time.days': '{n}d',
      'time.months': '{n}mo',
      'time.years': '{n}y',
    };
    // #endregion

    // #region styles
    /** Package-owned styles. Every surface renders its own copy in a <style> element. */
    const CSS = [
      '.dshsh-page{box-sizing:border-box;display:flex;flex-direction:column;align-items:center;gap:16px;width:100%;height:100%;min-height:0;padding:0 clamp(24px,4vw,48px) 48px;overflow-y:auto;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:14px;line-height:1.6}',
      '.dshsh-page>*{box-sizing:border-box;width:100%;max-width:960px}',
      '.dshsh-page-head{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:16px;padding-top:28px}',
      '[data-platform=darwin] .dshsh-page-head{padding-top:calc(28px + var(--dsh-frame-top-clearance,0px))}',
      '.dshsh-page-titles{flex:1;min-width:0}',
      '.dshsh-page-title{display:flex;align-items:center;gap:8px;margin:0;font-size:20px;font-weight:500;line-height:28px}',
      '.dshsh-page-sub{margin:4px 0 0;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px}',
      '.dshsh-icon{flex:none;display:inline-flex;align-items:center;justify-content:center}',
      '.dshsh-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;box-sizing:border-box;min-height:30px;padding:5px 13px;border-radius:calc(var(--dsw-radius-md,8px) - 1px);border:1px solid transparent;font:inherit;font-size:13px;line-height:20px;cursor:pointer;white-space:nowrap}',
      '.dshsh-btn:disabled{opacity:.55;cursor:default}',
      '.dshsh-btn-primary{color:var(--dsw-alias-label-primary-foreground,#fff);background:var(--dsw-alias-brand-primary);border-color:transparent}',
      '.dshsh-btn-primary:hover:not(:disabled){filter:brightness(1.06)}',
      '.dshsh-btn-ghost{color:var(--dsw-alias-label-primary);background:transparent;border-color:var(--dsw-alias-border-l2)}',
      '.dshsh-btn-ghost:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2)}',
      '.dshsh-banner{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:13px}',
      '.dshsh-banner-text{flex:1;min-width:0}',
      '.dshsh-banner-sub{margin-top:2px;color:var(--dsw-alias-label-secondary);font-size:12px}',
      '.dshsh-error{padding:9px 12px;border:1px solid var(--dsw-alias-state-error-primary);border-radius:10px;color:var(--dsw-alias-state-error-primary);font-size:12.5px;overflow-wrap:anywhere}',
      '.dshsh-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}',
      '.dshsh-page-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px}',
      '.dshsh-viewswitch{display:inline-flex;align-items:center;gap:2px;padding:2px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-md,8px);background:var(--dsw-alias-bg-layer-1)}',
      '.dshsh-viewbtn{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;padding:0;border:none;border-radius:calc(var(--dsw-radius-md,8px) - 3px);background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}',
      '.dshsh-viewbtn:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}',
      '.dshsh-viewbtn[aria-pressed=true]{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}',
      '.dshsh-list{display:flex;flex-direction:column;gap:2px;margin:0;padding:0;list-style:none}',
      '.dshsh-list-row{display:flex;align-items:center;gap:12px;box-sizing:border-box;width:100%;min-height:52px;padding:8px 12px;border:1px solid transparent;border-radius:10px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}',
      '.dshsh-list-row:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.dshsh-list-row.is-focus{border-color:var(--dsw-alias-border-l2)}',
      '.dshsh-list-icon{flex:none;display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;color:var(--dsw-alias-label-secondary)}',
      '.dshsh-list-body{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}',
      '.dshsh-list-title{display:flex;align-items:center;gap:8px;min-width:0;font-size:14px;font-weight:500;line-height:20px}',
      '.dshsh-list-title-text{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dshsh-list-meta{display:flex;align-items:center;gap:8px;min-width:0;color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:16px}',
      '.dshsh-list-path{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,monospace)}',
      '.dshsh-list-enter{flex:none;display:inline-flex;color:var(--dsw-alias-label-secondary);opacity:.7}',
      '.dshsh-list-row:hover .dshsh-list-enter{color:var(--dsw-alias-label-primary);opacity:1}',
      '.dshsh-loading{padding:14px 10px;color:var(--dsw-alias-label-secondary);font-size:12.5px;line-height:1.5;text-align:center}',
      '.dshsh-notice{padding:5px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:1.5}',
      '.dshsh-count{padding:0 2px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));font-size:11px}',
      '.dshsh-exitbtn{flex:none;display:inline-flex;align-items:center;gap:4px;height:26px;padding:0 9px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:20px;cursor:pointer;white-space:nowrap}',
      '.dshsh-exitbtn:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}',
      '.dshsh-pill{flex:none;padding:0 6px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;color:var(--dsw-alias-label-secondary);font-size:10px;line-height:1.6;font-weight:400}',
      '.dshsh-statusdot{flex:none;width:8px;height:8px;border-radius:50%;background:currentColor;color:var(--dsw-alias-state-idle-primary)}',
      '.dshsh-statusdot[data-state=warning]{color:var(--dsw-alias-state-warn-primary)}',
      '.dshsh-statusdot[data-state=done]{color:var(--dsw-alias-state-success-primary)}',
      '.dshsh-statusdot[data-state=running]{animation:dshsh-pulse 1.2s ease-in-out infinite}',
      '@keyframes dshsh-pulse{0%,100%{opacity:.35}50%{opacity:1}}',
      '@media (prefers-reduced-motion:reduce){.dshsh-statusdot[data-state=running]{animation:none;opacity:1}}',
      '.dshsh-row-leading{flex:none;display:inline-flex;align-items:center;justify-content:center;width:16px;height:20px}',
      '.dshsh-row-status{flex:none;font-size:10px;line-height:16px;white-space:nowrap;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary))}',
      '.dshsh-row-status[data-state=warning]{color:var(--dsw-alias-state-warn-primary)}',
      '.dshsh-row-status[data-state=done]{color:var(--dsw-alias-state-success-primary)}',
      '.dshsh-row-pin{flex:none;display:inline-flex;color:var(--dsw-alias-label-caption,var(--dsw-alias-label-secondary))}',
      '.dshsh-newrow{display:flex;align-items:center;gap:6px;box-sizing:border-box;flex:none;width:100%;height:30px;padding:0 8px;border:none;border-radius:var(--dsw-radius-md,8px);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;text-align:left;cursor:pointer}',
      '.dshsh-newrow:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}',
      '.dshsh-others-all{flex:none;display:flex;align-items:center;gap:6px;box-sizing:border-box;width:100%;height:28px;padding:0 6px;border:none;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;text-align:left;cursor:pointer}',
      '.dshsh-others-all:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}',
      '.dshsh-card:focus-visible,.dshsh-list-row:focus-visible,.dshsh-btn:focus-visible,.dshsh-viewbtn:focus-visible,.dshsh-row:focus-visible,.dshsh-ws-button:focus-visible,.dshsh-iconbtn:focus-visible,.dshsh-others-toggle:focus-visible,.dshsh-showmore:focus-visible,.dshsh-archived-toggle:focus-visible,.dshsh-ws-row:focus-visible,.dshsh-enter-ws:focus-visible,.dshsh-rail-btn:focus-visible,.dshsh-search-clear:focus-visible,.dshsh-exitbtn:focus-visible,.dshsh-newrow:focus-visible,.dshsh-others-all:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));outline-offset:1px}',
      '.dshsh-card{position:relative;display:flex;flex-direction:column;gap:7px;box-sizing:border-box;width:100%;text-align:left;padding:13px 15px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);color:inherit;font:inherit;cursor:pointer}',
      '.dshsh-card:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.dshsh-card.is-focus{border-color:var(--dsw-alias-brand-primary)}',
      '.dshsh-card-top{display:flex;align-items:center;gap:8px;min-width:0}',
      '.dshsh-card-title{flex:1;min-width:0;font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.dshsh-badge{flex:none;padding:1px 7px;border:1px solid var(--dsw-alias-brand-primary);border-radius:999px;color:var(--dsw-alias-brand-primary);font-size:11px;line-height:1.6}',
      '.dshsh-card-path{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--dsw-alias-label-secondary);font-size:11.5px;font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,monospace)}',
      '.dshsh-card-meta{display:flex;align-items:center;gap:10px;color:var(--dsw-alias-label-secondary);font-size:11.5px;min-height:16px}',
      '.dshsh-dot{flex:none;width:3px;height:3px;border-radius:50%;background:currentColor;opacity:.6}',
      '.dshsh-empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:48px 16px;color:var(--dsw-alias-label-secondary);text-align:center}',
      '.dshsh-empty-title{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600}',
      '.dshsh-empty-body{font-size:12.5px;line-height:1.6;max-width:360px}',
      '.dshsh-sidebar{display:flex;flex:1;flex-direction:column;gap:6px;box-sizing:border-box;width:100%;min-height:0;padding:2px var(--dsh-sidebar-inline-padding,12px) 4px 0;overflow:hidden;color:var(--dsw-alias-label-primary);font-size:14px}',
      '.dshsh-sidebar-head{flex:none;display:flex;align-items:center;gap:4px;min-width:0}',
      '.dshsh-ws-button{display:flex;flex:1;flex-direction:column;gap:1px;min-width:0;padding:4px 7px;border:none;border-radius:8px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}',
      '.dshsh-ws-button:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.dshsh-ws-name{display:flex;align-items:center;gap:6px;min-width:0;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden}',
      '.dshsh-ws-name-text{min-width:0;overflow:hidden;text-overflow:ellipsis}',
      '.dshsh-ws-path{color:var(--dsw-alias-label-secondary);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,monospace)}',
      '.dshsh-iconbtn{flex:none;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;padding:0;border:none;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}',
      '.dshsh-iconbtn:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}',
      '.dshsh-search{flex:none;display:flex;align-items:center;gap:6px;box-sizing:border-box;min-height:28px;padding:0 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}',
      '.dshsh-search:focus-within{border-color:var(--dsw-alias-border-l2);outline:2px solid var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));outline-offset:1px}',
      '.dshsh-search input{flex:1;min-width:0;padding:4px 0;border:none;outline:none;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px}',
      '.dshsh-search input::placeholder{color:var(--dsw-alias-label-secondary)}',
      '.dshsh-search-clear{flex:none;display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;padding:0;border:none;border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:13px;line-height:1}',
      '.dshsh-search-clear:hover{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}',
      '.dshsh-rows{display:flex;flex-direction:column;gap:1px}',
      '.dshsh-rows>div{display:contents}',
      '.dshsh-scroll{display:flex;flex:1;flex-direction:column;gap:1px;min-height:0;overflow-y:auto;overflow-x:hidden;scrollbar-gutter:stable;padding:0 1px 6px}',
      '.dshsh-row{display:flex;align-items:center;gap:6px;box-sizing:border-box;width:100%;height:32px;padding:0 8px;border:none;border-radius:var(--dsw-radius-md,8px);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;line-height:20px;text-align:left;cursor:pointer}',
      '.dshsh-row:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.dshsh-row.is-current{background:var(--dsw-alias-bg-layer-2)}',
      '.dshsh-row.is-archived{opacity:.6;cursor:default}',
      '.dshsh-row.is-archived:hover{background:transparent}',
      '.dshsh-row.is-archived .dshsh-row-title{color:var(--dsw-alias-label-caption,var(--dsw-alias-label-secondary))}',
      '.dshsh-row-title{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}',
      '.dshsh-row-time{flex:none;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));font-size:10px;line-height:16px;white-space:nowrap}',
      '.dshsh-row-tag{flex:none;padding:0 6px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;color:var(--dsw-alias-label-secondary);font-size:10.5px;line-height:1.6}',
      '.dshsh-showmore{align-self:flex-start;padding:4px 8px;border:none;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer}',
      '.dshsh-showmore:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}',
      '.dshsh-list-empty{padding:14px 10px;color:var(--dsw-alias-label-secondary);font-size:12.5px;line-height:1.5;text-align:center}',
      '.dshsh-archived-toggle{flex:none;display:flex;align-items:center;gap:6px;align-self:flex-start;padding:3px 7px;border:none;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11.5px;cursor:pointer}',
      '.dshsh-archived-toggle:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.dshsh-archived-toggle .dshsh-check{flex:none;width:12px;height:12px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);border-radius:3px;display:inline-flex;align-items:center;justify-content:center;font-size:9px;line-height:1}',
      '.dshsh-archived-toggle[aria-pressed=true]{color:var(--dsw-alias-label-primary)}',
      '.dshsh-archived-toggle[aria-pressed=true] .dshsh-check{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground,#fff)}',
      '.dshsh-others{display:flex;flex:none;flex-direction:column;min-height:0;border-top:1px solid var(--dsw-alias-border-l1);padding-top:4px}',
      '.dshsh-others.is-expanded{max-height:48%}',
      '.dshsh-others-toggle{display:flex;flex:none;align-items:center;gap:6px;box-sizing:border-box;width:100%;min-height:28px;padding:3px 8px;border:none;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;text-align:left;cursor:pointer}',
      '.dshsh-others-toggle:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
      '.dshsh-others-count{flex:none;margin-left:auto;font-size:11px;opacity:.85}',
      '.dshsh-others-body{display:flex;flex:1;flex-direction:column;gap:2px;min-height:0;overflow-y:auto;padding:2px 0 6px}',
      '.dshsh-ws-row{display:flex;align-items:center;gap:6px;box-sizing:border-box;flex:1;min-width:0;height:30px;padding:0 6px;border:none;border-radius:var(--dsw-radius-md,8px);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;text-align:left;cursor:pointer}',
      '.dshsh-ws-line{display:flex;align-items:center;gap:2px}',
      '.dshsh-ws-row:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.dshsh-ws-row-name{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-weight:500}',
      '.dshsh-ws-row-count{flex:none;color:var(--dsw-alias-label-secondary);font-size:11px}',
      '.dshsh-chev{flex:none;transition:transform .15s ease}',
      '.dshsh-chev.is-open{transform:rotate(90deg)}',
      '.dshsh-other-sessions{display:flex;flex-direction:column;gap:1px;padding:1px 0 4px 12px;border-left:1px solid var(--dsw-alias-border-l1);margin:1px 0 3px 12px}',
      '.dshsh-enter-ws{flex:none;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;padding:0;border:none;border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}',
      '.dshsh-enter-ws:hover{color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-1)}',
      '.dshsh-rail{display:flex;flex:1;flex-direction:column;align-items:center;gap:8px;box-sizing:border-box;width:100%;min-height:0;padding:2px 0 0}',
      '.dshsh-rail-btn{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border:none;border-radius:10px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}',
      '.dshsh-rail-btn:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}',
      '.dshsh-rail-dot{width:5px;height:5px;border-radius:50%;background:var(--dsw-alias-brand-primary)}',
    ].join('');

    /**
     * Install the package stylesheet once, owned by the plugin fiber. Every
     * surface renders `styleTag()` (null) so the markup stays inert.
     * @returns disposer removing the stylesheet.
     */
    function installStylesheet() {
      const doc = typeof document === 'undefined' ? undefined : document;
      if (doc === undefined) return () => {};
      const tag = doc.createElement('style');
      tag.dataset.dshPlugin = 'sidebar-home';
      tag.textContent = CSS;
      doc.head.appendChild(tag);
      return () => {
        tag.remove();
      };
    }

    /** Styles are installed once from `apply`; surfaces render no extra style tags. */
    function styleTag() {
      return null;
    }
    // #endregion

    // #region tiny snapshot store
    /**
     * Create a minimal observable store with a persisted snapshot.
     * @param initial - initial snapshot.
     * @returns getSnapshot/subscribe/update.
     */
    function createStore(initial) {
      let snapshot = initial;
      const listeners = new Set();
      return {
        getSnapshot() {
          return snapshot;
        },
        subscribe(listener) {
          listeners.add(listener);
          return () => {
            listeners.delete(listener);
          };
        },
        update(patch) {
          let changed = false;
          for (const key of Object.keys(patch)) {
            if (snapshot[key] !== patch[key]) {
              changed = true;
              break;
            }
          }
          if (!changed) return;
          snapshot = { ...snapshot, ...patch };
          saveFocusState(snapshot);
          for (const listener of [...listeners]) {
            try {
              listener();
            } catch (error) {
              console.error('[sidebar-home] focus listener failed:', error);
            }
          }
        },
      };
    }

    /** Default (not yet entered) focus state. */
    function defaultFocusState() {
      return {
        focusWorkspaceId: null,
        showArchived: false,
        otherExpanded: false,
        expandedWorkspaces: [],
        homeLayout: 'grid',
      };
    }

    /** Read the persisted focus state, tolerating absent or malformed storage. */
    function loadFocusState() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw === null) return defaultFocusState();
        const parsed = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null) return defaultFocusState();
        return {
          focusWorkspaceId: typeof parsed.focusWorkspaceId === 'string' ? parsed.focusWorkspaceId : null,
          showArchived: parsed.showArchived === true,
          otherExpanded: parsed.otherExpanded === true,
          expandedWorkspaces: Array.isArray(parsed.expandedWorkspaces)
            ? parsed.expandedWorkspaces.filter((id) => typeof id === 'string')
            : [],
          homeLayout: parsed.homeLayout === 'list' ? 'list' : 'grid',
        };
      } catch {
        return defaultFocusState();
      }
    }

    /** Persist the focus state; storage failures never break the UI. */
    function saveFocusState(snapshot) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {
        /* storage unavailable — keep the in-memory state */
      }
    }
    // #endregion

    // #region helpers
    /**
     * Localized workspace title: the stored default-workspace name follows the locale.
     * @param title - stored title.
     * @param t - translate function.
     * @returns title to display.
     */
    function workspaceDisplayTitle(title, t) {
      if (!title || title === 'default-workspace') return t('workspace.defaultName');
      return title;
    }

    /**
     * Directory basename accepting both separators.
     * @param path - absolute path.
     * @returns basename, or the input when it has none.
     */
    function basename(path) {
      const trimmed = String(path || '').replace(/[/\\]+$/, '');
      const index = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'));
      return index === -1 ? trimmed : trimmed.slice(index + 1);
    }

    /**
     * Localized compact relative time for a session timestamp.
     * @param updatedAt - epoch milliseconds.
     * @param now - current epoch milliseconds.
     * @param t - translate function.
     * @returns short relative label.
     */
    function timeLabel(updatedAt, now, t) {
      if (typeof updatedAt !== 'number' || !Number.isFinite(updatedAt)) return '';
      const delta = Math.max(0, now - updatedAt);
      if (delta < 6e4) return t('time.now');
      if (delta < 36e5) return t('time.minutes', { n: Math.floor(delta / 6e4) });
      if (delta < 864e5) return t('time.hours', { n: Math.floor(delta / 36e5) });
      if (delta < 30 * 864e5) return t('time.days', { n: Math.floor(delta / 864e5) });
      if (delta < 365 * 864e5) return t('time.months', { n: Math.floor(delta / (30 * 864e5)) });
      return t('time.years', { n: Math.floor(delta / (365 * 864e5)) });
    }

    /** Identity selector for whole-snapshot subscriptions (module-level = stable). */
    function selectIdentity(state) {
      return state;
    }

    /** True when the summary is a real, openable session row. */
    function isOpenable(summary) {
      return summary !== undefined && summary.origin !== 'subagent';
    }

    /** Localized singular/plural choice for count phrases. */
    function plural(t, base, n) {
      return t(base + (n === 1 ? '.one' : '.other'), { n });
    }

    /** Re-render relative timestamps once a minute while a surface is mounted. */
    function useNow() {
      const [now, setNow] = useState(() => Date.now());
      useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 60_000);
        return () => clearInterval(timer);
      }, []);
      return now;
    }

    /**
     * Session attention state used for the row indicator and for keeping
     * attention-bearing rows visible behind the row cap.
     * @param summary - session summary.
     * @param status - runtime status entry (may be undefined).
     * @param t - translate function.
     * @returns null for idle, otherwise `{ state, label }`.
     */
    function statusOf(summary, status, t) {
      const kind = status?.pendingInteraction?.kind;
      if (kind === 'approval') return { state: 'warning', label: t('focus.status.approval') };
      if (kind === 'plan-review') return { state: 'warning', label: t('focus.status.planReview') };
      if (kind === 'question') return { state: 'warning', label: t('focus.status.question') };
      if (status?.running === true || summary?.running === true) {
        return { state: 'running', label: t('focus.status.running') };
      }
      if (status?.completionUnread === true) return { state: 'done', label: t('focus.status.done') };
      return null;
    }

    /**
     * Derive the sessions one workspace should show.
     * @param workspace - WorkspaceView (tolerates missing membership).
     * @param sessions - sessions list snapshot.
     * @param archivedIds - Set of archived session ids.
     * @param showArchived - whether archived rows are included.
     * @param currentSessionId - main-view session id, if any.
     * @param pinnedIds - Set of pinned session ids.
     * @returns ids ordered blank-current, pinned, then newest first.
     */
    function workspaceSessionIds(workspace, sessions, archivedIds, showArchived, currentSessionId, pinnedIds) {
      const ids = [];
      const members = Array.isArray(workspace?.sessionIds) ? workspace.sessionIds : [];
      for (const id of members) {
        const summary = sessions?.byId?.[id];
        if (!isOpenable(summary)) continue;
        if (summary.blank && id !== currentSessionId) continue;
        if (!showArchived && archivedIds.has(id)) continue;
        ids.push(id);
      }
      ids.sort((a, b) => {
        const aBlank = sessions.byId[a]?.blank === true;
        const bBlank = sessions.byId[b]?.blank === true;
        if (aBlank !== bBlank) return aBlank ? -1 : 1;
        const aPinned = pinnedIds?.has(a) === true && !archivedIds.has(a);
        const bPinned = pinnedIds?.has(b) === true && !archivedIds.has(b);
        if (aPinned !== bPinned) return aPinned ? -1 : 1;
        if (aPinned && bPinned) return members.indexOf(a) - members.indexOf(b);
        return (sessions.byId[b]?.updatedAt ?? 0) - (sessions.byId[a]?.updatedAt ?? 0);
      });
      return ids;
    }

    /** Aggregate session count / newest activity of one workspace for the Home list. */
    function workspaceStats(workspace, sessions, archivedIds) {
      let active = 0;
      let archived = 0;
      let newest = 0;
      const members = Array.isArray(workspace?.sessionIds) ? workspace.sessionIds : [];
      for (const id of members) {
        const summary = sessions?.byId?.[id];
        if (!isOpenable(summary) || summary.blank) continue;
        if (archivedIds.has(id)) {
          archived += 1;
          continue;
        }
        active += 1;
        if (typeof summary.updatedAt === 'number' && summary.updatedAt > newest) newest = summary.updatedAt;
      }
      return { active, archived, newest };
    }

    /** Find the session currently held by the main view. */
    function currentMainSessionId(sessions) {
      const byId = sessions?.byId || {};
      for (const summary of Object.values(byId)) {
        if ((summary.retainedBy?.mainView ?? 0) > 0) return summary.id;
      }
      return undefined;
    }

    /** Find the workspace that owns a session, if any. */
    function workspaceOfSession(workspaceViews, sessionId) {
      if (sessionId === undefined) return undefined;
      for (const workspace of workspaceViews || []) {
        if (Array.isArray(workspace.sessionIds) && workspace.sessionIds.includes(sessionId)) {
          return workspace.workspaceId;
        }
      }
      return undefined;
    }

    /**
     * Ids that must stay visible behind the row cap: the current session and
     * every row carrying an attention state.
     */
    function attentionSet(ids, sessions, statuses, currentId, t) {
      const flagged = new Set();
      for (const id of ids) {
        if (id === currentId) {
          flagged.add(id);
          continue;
        }
        if (statusOf(sessions.byId[id], statuses?.get?.(id), t) !== null) flagged.add(id);
      }
      return flagged;
    }
    // #endregion

    // #region icons
    /** Shared inline-SVG frame so every glyph inherits the host color and size. */
    function glyph(size, children, extra) {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.3,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          className: 'dshsh-icon',
          ...(extra || {}),
        },
        children,
      );
    }

    /** House icon: the Home entry mark. */
    function HomeGlyph(props) {
      const size = props.size || 16;
      return glyph(size, [
        h('path', { key: 'roof', d: 'M2.6 7.1 8 2.6l5.4 4.5' }),
        h('path', { key: 'walls', d: 'M4.1 7v6.1h7.8V7' }),
        h('path', { key: 'door', d: 'M6.6 13.1V9.7h2.8v3.4' }),
      ]);
    }

    /** Folder icon. */
    function FolderGlyph(props) {
      const size = props.size || 16;
      return glyph(size, [
        h('path', {
          key: 'folder',
          d: 'M2.1 4.6c0-.5.4-.9.9-.9h2.7l1.2 1.4h5c.5 0 .9.4.9.9v5.5c0 .5-.4.9-.9.9H3c-.5 0-.9-.4-.9-.9V4.6Z',
        }),
      ]);
    }

    /** Right chevron; rotate through CSS when open. */
    function ChevronGlyph(props) {
      const size = props.size || 12;
      return glyph(size, [h('path', { key: 'chev', d: 'M6 3.6 10.4 8 6 12.4' })], {
        className: 'dshsh-icon dshsh-chev' + (props.open ? ' is-open' : ''),
      });
    }

    /** Search magnifier. */
    function SearchGlyph(props) {
      const size = props.size || 13;
      return glyph(size, [
        h('circle', { key: 'lens', cx: 6.9, cy: 6.9, r: 3.7 }),
        h('path', { key: 'handle', d: 'M9.7 9.7 13.1 13.1' }),
      ]);
    }

    /** Plus mark. */
    function PlusGlyph(props) {
      const size = props.size || 14;
      return glyph(size, [
        h('path', { key: 'v', d: 'M8 3.2v9.6' }),
        h('path', { key: 'h', d: 'M3.2 8h9.6' }),
      ]);
    }

    /** Left chevron used as the exit-focus mark. */
    function BackGlyph(props) {
      const size = props.size || 15;
      return glyph(size, [h('path', { key: 'back', d: 'M10.2 3.4 5.6 8l4.6 4.6' })]);
    }

    /** Arrow into a workspace. */
    function EnterGlyph(props) {
      const size = props.size || 12;
      return glyph(size, [
        h('path', { key: 'arrow', d: 'M3.4 8h9.2' }),
        h('path', { key: 'head', d: 'M9.4 4.8 12.6 8l-3.2 3.2' }),
      ]);
    }

    /** 2x2 grid mark for the card-layout switch. */
    function GridGlyph(props) {
      const size = props.size || 14;
      return glyph(size, [
        h('rect', { key: 'a', x: 2.4, y: 2.4, width: 4.6, height: 4.6, rx: 1.1 }),
        h('rect', { key: 'b', x: 9, y: 2.4, width: 4.6, height: 4.6, rx: 1.1 }),
        h('rect', { key: 'c', x: 2.4, y: 9, width: 4.6, height: 4.6, rx: 1.1 }),
        h('rect', { key: 'd', x: 9, y: 9, width: 4.6, height: 4.6, rx: 1.1 }),
      ]);
    }

    /** Three-line mark for the compact-list switch. */
    function ListGlyph(props) {
      const size = props.size || 14;
      return glyph(size, [
        h('path', { key: 'a', d: 'M2.4 4h11.2' }),
        h('path', { key: 'b', d: 'M2.4 8h11.2' }),
        h('path', { key: 'c', d: 'M2.4 12h11.2' }),
      ]);
    }

    /** Pushpin mark for pinned sessions. */
    function PinGlyph(props) {
      const size = props.size || 11;
      return glyph(size, [
        h('path', { key: 'cap', d: 'M5.2 2.8h5.6' }),
        h('path', { key: 'body', d: 'M6.2 2.8 5.4 7 3.5 8.9h9L10.6 7 9.8 2.8' }),
        h('path', { key: 'stem', d: 'M8 8.9v4.5' }),
      ]);
    }

    /** Non-idle session status dot. */
    function StatusDot({ state, label }) {
      return h('span', {
        className: 'dshsh-statusdot',
        'data-state': state,
        title: label,
        'aria-label': label,
        role: 'img',
      });
    }
    // #endregion

    // #region session rows
    /**
     * One list of session rows with a "show the rest" affordance. The current
     * session and every attention-bearing row stay visible behind the cap.
     * @param props - ids, session data, status map, and callbacks.
     * @returns row list element.
     */
    function SessionRows({
      ids,
      sessions,
      archivedIds,
      pinnedIds,
      statuses,
      currentId,
      t,
      onOpen,
      onArchived,
      emptyText,
    }) {
      const [showAll, setShowAll] = useState(false);
      const now = useNow();
      const currentRef = useRef(null);
      useEffect(() => {
        const node = currentRef.current;
        if (node !== null && typeof node.scrollIntoView === 'function') {
          node.scrollIntoView({ block: 'nearest' });
        }
      }, [currentId, ids.length]);
      if (ids.length === 0) return h('div', { className: 'dshsh-list-empty' }, emptyText);
      const flagged = attentionSet(ids, sessions, statuses, currentId, t);
      const visible = ids.filter((id, index) => index < ROW_LIMIT || flagged.has(id));
      const shown = showAll ? ids : visible;
      const rest = ids.length - visible.length;
      return h(
        'div',
        { className: 'dshsh-rows', role: 'list' },
        shown.map((id) => {
          const summary = sessions.byId[id];
          const archived = archivedIds.has(id);
          const pinned = pinnedIds?.has(id) === true && !archived;
          const status = archived ? null : statusOf(summary, statuses?.get?.(id), t);
          const title = summary.blank ? t('focus.newSession') : summary.title?.trim() || t('focus.untitled');
          const time = summary.blank || status !== null ? '' : timeLabel(summary.updatedAt, now, t);
          const isCurrent = id === currentId;
          return h(
            'div',
            { key: id, role: 'listitem' },
            h(
              'button',
              {
                ref: isCurrent ? currentRef : undefined,
                type: 'button',
                className: 'dshsh-row' + (isCurrent ? ' is-current' : '') + (archived ? ' is-archived' : ''),
                'aria-current': isCurrent ? 'true' : undefined,
                'aria-disabled': archived ? 'true' : undefined,
                title: archived ? t('focus.archivedHint') : title,
                onClick: archived ? () => onArchived?.(id) : () => onOpen(id),
              },
              h(
                'span',
                { className: 'dshsh-row-leading' },
                status !== null ? h(StatusDot, { state: status.state, label: status.label }) : null,
              ),
              h('span', { className: 'dshsh-row-title' }, title),
              archived ? h('span', { className: 'dshsh-row-tag' }, t('focus.archived')) : null,
              status !== null
                ? h('span', { className: 'dshsh-row-status', 'data-state': status.state }, status.label)
                : null,
              time !== '' ? h('span', { className: 'dshsh-row-time' }, time) : null,
              pinned
                ? h(
                    'span',
                    { className: 'dshsh-row-pin', title: t('focus.pinned'), 'aria-label': t('focus.pinned') },
                    h(PinGlyph, { size: 11 }),
                  )
                : null,
            ),
          );
        }),
        rest > 0
          ? h(
              'button',
              {
                key: 'dshsh-more',
                type: 'button',
                className: 'dshsh-showmore',
                onClick: () => setShowAll(true),
              },
              t('focus.showMore', { n: rest }),
            )
          : null,
        showAll && ids.length > visible.length
          ? h(
              'button',
              {
                key: 'dshsh-less',
                type: 'button',
                className: 'dshsh-showmore',
                onClick: () => setShowAll(false),
              },
              t('focus.showLess'),
            )
          : null,
      );
    }

    /** Home icon rendered inside one sidebar panel row. */
    function HomePanelIcon({ size }) {
      return h(HomeGlyph, { size: size || 16 });
    }
    // #endregion

    // #region Home panel
    /**
     * The `main` panel: every workspace as a card, plus add-workspace.
     * @param props - standard hooks, injected actions, and the locale seat.
     * @returns the page element.
     */
    function HomePanel({ useWorkspaces, useSessions, useHome, homeActions, t }) {
      const workspacesState = useWorkspaces(selectIdentity);
      const sessions = useSessions(selectIdentity);
      const home = useHome(selectIdentity);
      const [error, setError] = useState(null);
      const [adding, setAdding] = useState(false);
      const archivedIds = useMemo(
        () => new Set(workspacesState.archivedSessionIds || []),
        [workspacesState.archivedSessionIds],
      );

      const workspaceViews = workspacesState.items || [];
      const focused = workspaceViews.find((item) => item.workspaceId === home.focusWorkspaceId);
      const ready = workspacesState.phase === 'ready';
      const layout = home.homeLayout === 'list' ? 'list' : 'grid';

      const enterWorkspace = (workspaceId) => {
        setError(null);
        homeActions
          .enterWorkspace(workspaceId)
          .catch((reason) => setError(t('home.error.open', { message: messageOf(reason) })));
      };

      const addWorkspace = () => {
        if (adding) return;
        setAdding(true);
        setError(null);
        homeActions
          .addWorkspace()
          .catch((reason) => setError(t('home.error.add', { message: messageOf(reason) })))
          .finally(() => setAdding(false));
      };

      const now = useNow();

      /** Meta fragments shared by the card and list row renderers. */
      const metaOf = (stats) => {
        const parts = [
          h(
            'span',
            { key: 'sessions' },
            stats.active > 0 ? plural(t, 'home.card.sessions', stats.active) : t('home.card.noSessions'),
          ),
        ];
        if (stats.archived > 0) {
          parts.push(h('span', { key: 'archived-dot', className: 'dshsh-dot' }));
          parts.push(h('span', { key: 'archived' }, plural(t, 'home.card.archived', stats.archived)));
        }
        if (stats.newest > 0) {
          parts.push(h('span', { key: 'active-dot', className: 'dshsh-dot' }));
          parts.push(
            h('span', { key: 'active' }, t('home.card.lastActive', { t: timeLabel(stats.newest, now, t) })),
          );
        }
        return parts;
      };

      const entries = workspaceViews.map((workspace) => ({
        workspace,
        stats: workspaceStats(workspace, sessions, archivedIds),
        isFocused: workspace.workspaceId === home.focusWorkspaceId,
      }));

      const renderCard = ({ workspace, stats, isFocused }) =>
        h(
          'button',
          {
            key: workspace.workspaceId,
            type: 'button',
            className: 'dshsh-card' + (isFocused ? ' is-focus' : ''),
            title: workspace.path,
            onClick: () => enterWorkspace(workspace.workspaceId),
          },
          h(
            'span',
            { className: 'dshsh-card-top' },
            h(FolderGlyph, { size: 15 }),
            h(
              'span',
              { className: 'dshsh-card-title' },
              workspaceDisplayTitle(workspace.title, t) || basename(workspace.path),
            ),
            isFocused ? h('span', { className: 'dshsh-badge' }, t('home.focus.active')) : null,
          ),
          h('span', { className: 'dshsh-card-path' }, workspace.path),
          h('span', { className: 'dshsh-card-meta' }, metaOf(stats)),
        );

      const renderListRow = ({ workspace, stats, isFocused }) =>
        h(
          'li',
          { key: workspace.workspaceId },
          h(
            'button',
            {
              type: 'button',
              className: 'dshsh-list-row' + (isFocused ? ' is-focus' : ''),
              title: workspace.path,
              onClick: () => enterWorkspace(workspace.workspaceId),
            },
            h('span', { className: 'dshsh-list-icon' }, h(FolderGlyph, { size: 16 })),
            h(
              'span',
              { className: 'dshsh-list-body' },
              h(
                'span',
                { className: 'dshsh-list-title' },
                h(
                  'span',
                  { className: 'dshsh-list-title-text' },
                  workspaceDisplayTitle(workspace.title, t) || basename(workspace.path),
                ),
                isFocused ? h('span', { className: 'dshsh-badge' }, t('home.focus.active')) : null,
              ),
              h(
                'span',
                { className: 'dshsh-list-meta' },
                h('span', { className: 'dshsh-list-path' }, workspace.path),
                metaOf(stats),
              ),
            ),
            h('span', { className: 'dshsh-list-enter' }, h(EnterGlyph, { size: 12 })),
          ),
        );

      const body =
        layout === 'list'
          ? h('ul', { className: 'dshsh-list' }, entries.map(renderListRow))
          : h('div', { className: 'dshsh-grid' }, entries.map(renderCard));

      return h(
        'section',
        { className: 'dshsh-page', 'data-dsh-plugin': 'sidebar-home' },
        styleTag(),
        h(
          'div',
          { className: 'dshsh-page-head' },
          h(
            'div',
            { className: 'dshsh-page-titles' },
            h('h1', { className: 'dshsh-page-title' }, h(HomeGlyph, { size: 18 }), t('home.title')),
            h('p', { className: 'dshsh-page-sub' }, t('home.subtitle')),
          ),
          h(
            'div',
            { className: 'dshsh-page-actions' },
            h(
              'div',
              { className: 'dshsh-viewswitch', role: 'group', 'aria-label': t('home.view.label') },
              h(
                'button',
                {
                  type: 'button',
                  className: 'dshsh-viewbtn',
                  'aria-pressed': layout === 'grid' ? 'true' : 'false',
                  title: t('home.view.grid'),
                  'aria-label': t('home.view.grid'),
                  onClick: () => homeActions.setHomeLayout('grid'),
                },
                h(GridGlyph, { size: 14 }),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dshsh-viewbtn',
                  'aria-pressed': layout === 'list' ? 'true' : 'false',
                  title: t('home.view.list'),
                  'aria-label': t('home.view.list'),
                  onClick: () => homeActions.setHomeLayout('list'),
                },
                h(ListGlyph, { size: 14 }),
              ),
            ),
            h(
              'button',
              { type: 'button', className: 'dshsh-btn dshsh-btn-primary', onClick: addWorkspace, disabled: adding },
              h(PlusGlyph, { size: 13 }),
              adding ? t('home.adding') : t('home.addWorkspace'),
            ),
          ),
        ),
        focused
          ? h(
              'div',
              { className: 'dshsh-banner' },
              h(FolderGlyph, { size: 15 }),
              h(
                'div',
                { className: 'dshsh-banner-text' },
                h('div', null, t('home.focus.banner', { title: workspaceDisplayTitle(focused.title, t) })),
                h('div', { className: 'dshsh-banner-sub' }, t('home.focus.hint')),
              ),
              h(
                'button',
                { type: 'button', className: 'dshsh-btn dshsh-btn-ghost', onClick: () => homeActions.exitFocus() },
                t('home.exitFocus'),
              ),
            )
          : null,
        error !== null ? h('div', { className: 'dshsh-error', role: 'alert' }, error) : null,
        !ready && entries.length === 0
          ? h('div', { className: 'dshsh-loading' }, t('home.loading'))
          : workspacesState.error != null
            ? h(
                'div',
                { className: 'dshsh-error', role: 'alert' },
                t('home.error.workspaces', { message: messageOf(workspacesState.error) }),
              )
            : entries.length === 0
              ? h(
                  'div',
                  { className: 'dshsh-empty' },
                  h(FolderGlyph, { size: 26 }),
                  h('div', { className: 'dshsh-empty-title' }, t('home.empty.title')),
                  h('div', { className: 'dshsh-empty-body' }, t('home.empty.body')),
                  h(
                    'button',
                    { type: 'button', className: 'dshsh-btn dshsh-btn-ghost', onClick: addWorkspace, disabled: adding },
                    h(PlusGlyph, { size: 13 }),
                    t('home.addWorkspace'),
                  ),
                )
              : body,
      );
    }

    /** Localize an unknown thrown value for an inline error line. */
    function messageOf(reason) {
      if (reason instanceof Error) return reason.message;
      return String(reason);
    }
    // #endregion

    // #region focused sidebar
    /**
     * The `sidebar.workspaces` occupant while focus mode is on: only the focused
     * workspace's sessions, with the other workspaces folded at the bottom.
     * @param props - shell owner share, standard hooks, injected actions, locale seat.
     * @returns the browsing region element.
     */
    function FocusedSidebar({
      wide,
      expandSidebar,
      useWorkspaces,
      useSessions,
      useSessionStatus,
      usePanelInfo,
      useHome,
      homeActions,
      t,
    }) {
      const workspacesState = useWorkspaces(selectIdentity);
      const sessions = useSessions(selectIdentity);
      const statuses = useSessionStatus(selectIdentity);
      const panelInfo = usePanelInfo(selectIdentity);
      const home = useHome(selectIdentity);
      const [query, setQuery] = useState('');
      const [error, setError] = useState(null);
      const [notice, setNotice] = useState(null);
      const searchRef = useRef(null);
      const composing = useRef(false);

      const workspaceViews = workspacesState.items || [];
      const focused = workspaceViews.find((item) => item.workspaceId === home.focusWorkspaceId);
      const ready = workspacesState.phase === 'ready';
      const archivedIds = useMemo(
        () => new Set(workspacesState.archivedSessionIds || []),
        [workspacesState.archivedSessionIds],
      );
      const pinnedIds = useMemo(
        () => new Set(workspacesState.pinnedSessionIds || []),
        [workspacesState.pinnedSessionIds],
      );
      const currentId = currentMainSessionId(sessions);
      const panelActive = panelInfo?.activePanelId != null;
      const activeWorkspaceId = workspaceOfSession(workspaceViews, currentId);

      // A remembered focus target whose workspace disappeared falls back to Home.
      useEffect(() => {
        if (ready && home.focusWorkspaceId !== null && focused === undefined) {
          homeActions.exitFocus();
        }
      }, [ready, home.focusWorkspaceId, focused, homeActions]);

      // One invariant: while focus mode is on, it follows the visible conversation.
      // The Home panel is a neutral surface and never moves the focus.
      useEffect(() => {
        if (!ready || panelActive) return;
        if (activeWorkspaceId === undefined) return;
        if (home.focusWorkspaceId !== activeWorkspaceId) homeActions.setFocus(activeWorkspaceId);
      }, [ready, panelActive, activeWorkspaceId, home.focusWorkspaceId, homeActions]);

      // Search and transient notices are scoped to the focused workspace.
      useEffect(() => {
        setQuery('');
        setNotice(null);
      }, [home.focusWorkspaceId]);

      const onSearchKeyDown = (event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          setQuery('');
          searchRef.current?.blur();
        }
      };
      const reportArchived = () => setNotice(t('focus.notice.archived'));

      if (!wide) {
        return h(
          'div',
          { className: 'dshsh-rail', 'data-dsh-plugin': 'sidebar-home' },
          styleTag(),
          h(
            'button',
            {
              type: 'button',
              className: 'dshsh-rail-btn',
              title: t('focus.rail'),
              'aria-label': t('focus.rail'),
              onClick: () => expandSidebar?.(),
            },
            h(HomeGlyph, { size: 18 }),
          ),
          focused ? h('span', { className: 'dshsh-rail-dot', title: workspaceDisplayTitle(focused.title, t) }) : null,
        );
      }

      if (focused === undefined) {
        return h(
          'div',
          { className: 'dshsh-sidebar', 'data-dsh-plugin': 'sidebar-home' },
          styleTag(),
          h('div', { className: 'dshsh-loading' }, ready ? t('focus.empty') : t('focus.loading')),
        );
      }

      const focusedIds = workspaceSessionIds(
        focused,
        sessions,
        archivedIds,
        home.showArchived,
        currentId,
        pinnedIds,
      );
      const normalized = query.trim().toLowerCase();
      const visibleFocusedIds =
        normalized === ''
          ? focusedIds
          : focusedIds.filter((id) => {
              const summary = sessions.byId[id];
              const title = `${summary.displayTitle || ''} ${summary.title || ''}`.toLowerCase();
              return title.includes(normalized);
            });
      const focusedArchivedCount = (Array.isArray(focused.sessionIds) ? focused.sessionIds : []).filter(
        (id) => archivedIds.has(id) && isOpenable(sessions.byId[id]) && !sessions.byId[id].blank,
      ).length;
      const hasCurrentBlank =
        currentId !== undefined &&
        sessions.byId[currentId]?.blank === true &&
        Array.isArray(focused.sessionIds) &&
        focused.sessionIds.includes(currentId);

      const others = workspaceViews.filter((item) => item.workspaceId !== focused.workspaceId);
      const shownOthers = others.slice(0, OTHERS_LIMIT);
      const enterWorkspace = (workspaceId) => {
        setError(null);
        homeActions
          .enterWorkspace(workspaceId)
          .catch((reason) => setError(t('home.error.open', { message: messageOf(reason) })));
      };
      const openSession = (sessionId, workspaceId) => {
        setError(null);
        try {
          homeActions.openSession(sessionId, workspaceId);
        } catch (reason) {
          setError(t('home.error.open', { message: messageOf(reason) }));
        }
      };

      const title = workspaceDisplayTitle(focused.title, t);
      return h(
        'div',
        { className: 'dshsh-sidebar', 'data-dsh-plugin': 'sidebar-home' },
        styleTag(),
        h(
          'div',
          { className: 'dshsh-sidebar-head' },
          h(
            'button',
            {
              type: 'button',
              className: 'dshsh-ws-button',
              title: focused.path ? `${title} — ${focused.path}` : t('focus.backHome'),
              onClick: () => homeActions.goHome(),
            },
            h(
              'span',
              { className: 'dshsh-ws-name' },
              h(HomeGlyph, { size: 13 }),
              h('span', { className: 'dshsh-ws-name-text' }, title),
              h('span', { className: 'dshsh-pill' }, t('focus.mode')),
            ),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dshsh-exitbtn',
              title: t('focus.exit'),
              'aria-label': t('focus.exit'),
              onClick: () => homeActions.exitFocus(),
            },
            h(BackGlyph, { size: 13 }),
            t('focus.exit'),
          ),
        ),
        h(
          'div',
          { className: 'dshsh-search' },
          h(SearchGlyph, { size: 13 }),
          h('input', {
            ref: searchRef,
            type: 'search',
            value: query,
            placeholder: t('focus.search.placeholder'),
            'aria-label': t('focus.search.placeholder'),
            enterKeyHint: 'search',
            onKeyDown: onSearchKeyDown,
            onCompositionStart: () => {
              composing.current = true;
            },
            onCompositionEnd: (event) => {
              composing.current = false;
              setQuery(event.currentTarget.value);
            },
            onChange: (event) => {
              if (!composing.current) setQuery(event.currentTarget.value);
            },
          }),
          normalized !== ''
            ? h(
                'span',
                { className: 'dshsh-count' },
                t('focus.search.count', { visible: visibleFocusedIds.length, total: focusedIds.length }),
              )
            : null,
          query !== ''
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'dshsh-search-clear',
                  title: t('focus.search.clear'),
                  'aria-label': t('focus.search.clear'),
                  onClick: () => setQuery(''),
                },
                '×',
              )
            : null,
        ),
        notice !== null ? h('div', { className: 'dshsh-notice', role: 'status' }, notice) : null,
        error !== null ? h('div', { className: 'dshsh-error', role: 'alert' }, error) : null,
        focusedArchivedCount > 0
          ? h(
              'button',
              {
                type: 'button',
                className: 'dshsh-archived-toggle',
                'aria-pressed': home.showArchived ? 'true' : 'false',
                onClick: () => homeActions.toggleShowArchived(),
              },
              h('span', { className: 'dshsh-check', 'aria-hidden': 'true' }, home.showArchived ? '✓' : ''),
              home.showArchived ? t('focus.hideArchived') : t('focus.showArchived'),
              h('span', null, `(${focusedArchivedCount})`),
            )
          : null,
        !hasCurrentBlank
          ? h(
              'button',
              {
                type: 'button',
                className: 'dshsh-newrow',
                title: t('focus.newSessionRow'),
                onClick: () => enterWorkspace(focused.workspaceId),
              },
              h(PlusGlyph, { size: 12 }),
              t('focus.newSessionRow'),
            )
          : null,
        h(
          'div',
          { className: 'dshsh-scroll' },
          h(SessionRows, {
            key: focused.workspaceId,
            ids: visibleFocusedIds,
            sessions,
            archivedIds,
            pinnedIds,
            statuses,
            currentId: panelActive ? undefined : currentId,
            t,
            onOpen: (id) => openSession(id, focused.workspaceId),
            onArchived: reportArchived,
            emptyText: normalized === '' ? t('focus.empty') : t('focus.noMatches'),
          }),
          normalized !== '' && visibleFocusedIds.length === 0
            ? h('div', { className: 'dshsh-list-empty' }, t('focus.search.scope'))
            : null,
        ),
        others.length > 0
          ? h(
              'div',
              { className: 'dshsh-others' + (home.otherExpanded ? ' is-expanded' : '') },
              h(
                'button',
                {
                  type: 'button',
                  className: 'dshsh-others-toggle',
                  'aria-expanded': home.otherExpanded ? 'true' : 'false',
                  onClick: () => homeActions.toggleOtherExpanded(),
                },
                h(ChevronGlyph, { size: 11, open: home.otherExpanded }),
                h('span', null, t('focus.others')),
                h('span', { className: 'dshsh-others-count' }, t('focus.others.count', { n: others.length })),
              ),
              home.otherExpanded
                ? h(
                    'div',
                    { className: 'dshsh-others-body' },
                    shownOthers.map((workspace) => {
                      const expanded = home.expandedWorkspaces.includes(workspace.workspaceId);
                      const ids = workspaceSessionIds(
                        workspace,
                        sessions,
                        archivedIds,
                        home.showArchived,
                        currentId,
                        pinnedIds,
                      );
                      return h(
                        'div',
                        { key: workspace.workspaceId },
                        h(
                          'div',
                          { className: 'dshsh-ws-line' },
                          h(
                            'button',
                            {
                              type: 'button',
                              className: 'dshsh-ws-row',
                              'aria-expanded': expanded ? 'true' : 'false',
                              title: workspace.path,
                              onClick: () => homeActions.toggleWorkspaceExpanded(workspace.workspaceId),
                            },
                            h(ChevronGlyph, { size: 10, open: expanded }),
                            h(FolderGlyph, { size: 13 }),
                            h(
                              'span',
                              { className: 'dshsh-ws-row-name' },
                              workspaceDisplayTitle(workspace.title, t) || basename(workspace.path),
                            ),
                            h('span', { className: 'dshsh-ws-row-count' }, ids.length),
                          ),
                          h(
                            'button',
                            {
                              type: 'button',
                              className: 'dshsh-enter-ws',
                              title: t('focus.others.enter'),
                              'aria-label': t('focus.others.enter'),
                              onClick: () => enterWorkspace(workspace.workspaceId),
                            },
                            h(EnterGlyph, { size: 11 }),
                          ),
                        ),
                        expanded
                          ? h(
                              'div',
                              { className: 'dshsh-other-sessions' },
                              h(SessionRows, {
                                key: `${focused.workspaceId}:${workspace.workspaceId}`,
                                ids,
                                sessions,
                                archivedIds,
                                pinnedIds,
                                statuses,
                                currentId: panelActive ? undefined : currentId,
                                t,
                                onOpen: (id) => openSession(id, workspace.workspaceId),
                                onArchived: reportArchived,
                                emptyText: t('focus.empty'),
                              }),
                            )
                          : null,
                      );
                    }),
                    others.length > shownOthers.length
                      ? h(
                          'button',
                          {
                            type: 'button',
                            className: 'dshsh-others-all',
                            onClick: () => homeActions.goHome(),
                          },
                          t('focus.others.all'),
                        )
                      : null,
                  )
                : null,
            )
          : null,
      );
    }
    // #endregion

    // #region bind helper
    /**
     * Bind a translate function for the plugin namespace, falling back to the
     * key itself when the locale service is unavailable or misbehaving.
     * @param locale - locale service.
     * @param namespace - dictionary namespace.
     * @returns translate function.
     */
    function safeBind(locale, namespace) {
      try {
        return locale.bind(namespace);
      } catch (error) {
        console.error('[sidebar-home] locale bind failed:', error);
        return (key) => key;
      }
    }
    // #endregion

    // #region install
    /**
     * Hard dependency of the loader entry: the slot registry itself. Everything
     * else is injected into a child fiber, so a missing or renamed service leaves
     * this plugin inert instead of failing the whole Web boot audit.
     */
    const inject = ['slots'];
    /** Services the feature surfaces need; the child fiber owns their lifetime. */
    const FEATURE_SERVICES = ['locale', 'layout', 'uiWorkspace', 'workspaces'];

    /**
     * Activate the feature surfaces once their services are available.
     * @param root - loader-entry context (hard dependency: slots).
     */
    function apply(root) {
      try {
        root.inject(FEATURE_SERVICES, (ctx) => mount(ctx));
      } catch (error) {
        console.error('[sidebar-home] activation skipped:', error);
      }
    }

    /**
     * Mount the Home panel, its sidebar entry, and the focus-mode browsing region.
     * @param ctx - child context with the feature services injected.
     */
    function mount(ctx) {
      const uiWorkspace = ctx.uiWorkspace;
      const workspacesService = ctx.workspaces;
      ctx.effect(() => installStylesheet(), 'sidebar-home: styles');
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'sidebar-home: dictionaries');
      const t = safeBind(ctx.locale, NS);

      const focusStore = createStore(loadFocusState());

      /** Actions shared by both surfaces; all service lookups stay lazy. */
      const homeActions = {
        /** Enter a workspace: remember it and open its blank session. */
        enterWorkspace(workspaceId) {
          focusStore.update({ focusWorkspaceId: workspaceId });
          return Promise.resolve(uiWorkspace.openWorkspace(workspaceId));
        },
        /** Open one session, switching the focused workspace when it belongs elsewhere. */
        openSession(sessionId, workspaceId) {
          uiWorkspace.openSession(sessionId);
          if (workspaceId !== undefined && workspaceId !== focusStore.getSnapshot().focusWorkspaceId) {
            focusStore.update({ focusWorkspaceId: workspaceId });
            const expanded = focusStore.getSnapshot().expandedWorkspaces;
            if (expanded.includes(workspaceId)) {
              focusStore.update({ expandedWorkspaces: expanded.filter((id) => id !== workspaceId) });
            }
          }
        },
        /** Leave focus mode and restore the shipped workspace browser. */
        exitFocus() {
          focusStore.update({ focusWorkspaceId: null });
        },
        /** Select the Home main panel. */
        goHome() {
          const layout = ctx.get('layout');
          layout?.selectPanel?.(PANEL_ID);
        },
        /** Move the focus target without navigating (used by the follow invariant). */
        setFocus(workspaceId) {
          if (workspaceId !== focusStore.getSnapshot().focusWorkspaceId) {
            focusStore.update({ focusWorkspaceId: workspaceId });
          }
        },
        /** Switch the Home workspace list between cards and a compact list. */
        setHomeLayout(layout) {
          focusStore.update({ homeLayout: layout === 'list' ? 'list' : 'grid' });
        },
        /** Add a workspace through the host directory picker, then enter it. */
        async addWorkspace() {
          const path = await uiWorkspace.pickDirectory();
          if (path === null || path === undefined) return null;
          const workspace = await workspacesService.create({ path });
          focusStore.update({ focusWorkspaceId: workspace.workspaceId });
          await uiWorkspace.openWorkspace(workspace.workspaceId);
          return workspace.workspaceId;
        },
        toggleShowArchived() {
          focusStore.update({ showArchived: !focusStore.getSnapshot().showArchived });
        },
        toggleOtherExpanded() {
          focusStore.update({ otherExpanded: !focusStore.getSnapshot().otherExpanded });
        },
        toggleWorkspaceExpanded(workspaceId) {
          const current = focusStore.getSnapshot().expandedWorkspaces;
          focusStore.update({
            expandedWorkspaces: current.includes(workspaceId) ? [] : [workspaceId],
          });
        },
      };

      /** Inject face shared by both registrations (created once, cached by the renderer). */
      const injectFace = () => ({
        hooks: { home: focusStore },
        homeActions,
      });

      ctx.slots.inject('main', () =>
        ctx.slots.register(
          { name: 'main', key: PANEL_ID, locale: NS, inject: injectFace },
          HomePanel,
        ),
      );

      ctx.slots.inject('sidebar.panellist', () =>
        ctx.slots.register(
          {
            name: 'sidebar.panellist',
            id: PANEL_ID,
            order: PANEL_ORDER,
            label: () => t('nav.home'),
          },
          HomePanelIcon,
        ),
      );

      // Focus mode shadows the shipped browser (a priority well below its 0) only
      // while a workspace is focused; disposing the entry restores it untouched.
      let disposeFocusEntry = null;
      const syncFocusEntry = () => {
        const focused = focusStore.getSnapshot().focusWorkspaceId !== null;
        if (focused && disposeFocusEntry === null) {
          try {
            disposeFocusEntry = ctx.slots.register(
              { name: 'sidebar.workspaces', priority: -100, locale: NS, inject: injectFace },
              FocusedSidebar,
            );
          } catch (error) {
            console.error('[sidebar-home] cannot replace the workspace browser:', error);
            focusStore.update({ focusWorkspaceId: null });
          }
        } else if (!focused && disposeFocusEntry !== null) {
          const dispose = disposeFocusEntry;
          disposeFocusEntry = null;
          dispose();
        }
      };
      ctx.effect(() => {
        const disposeInject = ctx.slots.inject('sidebar.workspaces', () => {
          const off = focusStore.subscribe(syncFocusEntry);
          syncFocusEntry();
          return () => {
            off();
            if (disposeFocusEntry !== null) {
              const dispose = disposeFocusEntry;
              disposeFocusEntry = null;
              dispose();
            }
          };
        });
        return () => {
          disposeInject();
          if (disposeFocusEntry !== null) {
            const dispose = disposeFocusEntry;
            disposeFocusEntry = null;
            dispose();
          }
        };
      }, 'sidebar-home: focus-mode browsing region');
    }
    // #endregion

    return { inject, apply };
  },
});
