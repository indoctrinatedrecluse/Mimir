import React, { useState } from 'react';
import { YggdrasilWorkspace, Tab } from '@/types';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { runicAudio } from '@/core/audio/runicAudio';
import { Plus, MoreVertical, Moon, Edit2, Trash2, Layers } from 'lucide-react';

interface WorkspaceRibbonProps {
  workspaces: YggdrasilWorkspace[];
  activeWorkspaceId: string;
  tabs: Tab[];
  isCollapsed: boolean;
  onSelectWorkspace: (id: string) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (ws: YggdrasilWorkspace) => void;
  onDeleteWorkspace: (id: string) => void;
  onHibernateWorkspaceTabs: (wsId: string) => void;
}

export const WorkspaceRibbon: React.FC<WorkspaceRibbonProps> = ({
  workspaces,
  activeWorkspaceId,
  tabs,
  isCollapsed,
  onSelectWorkspace,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteWorkspace,
  onHibernateWorkspaceTabs,
}) => {
  const [menuWsId, setMenuWsId] = useState<string | null>(null);

  // Close context menu on global click
  React.useEffect(() => {
    const handleGlobalClick = () => setMenuWsId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const getWorkspaceTabCount = (wsId: string) => {
    return tabs.filter((t) => (t.workspaceId || workspaces[0]?.id) === wsId).length;
  };

  return (
    <div className="relative border-b border-white/5 bg-black/40 px-2 py-1.5 select-none">
      {/* Workspace Selector Strip */}
      <div className={`flex items-center gap-1.5 ${isCollapsed ? 'flex-col justify-center' : 'flex-wrap'}`}>
        {workspaces.map((ws, index) => {
          const isActive = ws.id === activeWorkspaceId;
          const theme = REALM_THEMES[ws.realm] || REALM_THEMES.midgard;
          const count = getWorkspaceTabCount(ws.id);
          const hotkey = index < 9 ? `Alt+${index + 1}` : undefined;

          return (
            <div key={ws.id} className="relative group">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  runicAudio.playClick(600);
                  onSelectWorkspace(ws.id);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuWsId(ws.id);
                }}
                title={`${ws.name} (${count} threads) • ${hotkey || ''}`}
                className={`flex items-center gap-1.5 rounded-lg border text-left transition-all ${
                  isCollapsed ? 'h-8 w-8 justify-center p-0' : 'px-2 py-1 text-xs'
                } ${
                  isActive
                    ? 'border-white/30 bg-white/10 shadow-md font-semibold text-white'
                    : 'border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/15 hover:bg-white/[0.06] hover:text-slate-200'
                }`}
                style={{
                  borderColor: isActive ? (ws.color || theme.accentColor) : undefined,
                  boxShadow: isActive ? `0 0 10px ${ws.color || theme.accentColor}25` : undefined,
                }}
              >
                {/* Runic Sigil */}
                <span
                  className="font-serif text-sm leading-none"
                  style={{ color: ws.color || theme.accentColor }}
                >
                  {ws.rune}
                </span>

                {/* Name & Count (Expanded mode) */}
                {!isCollapsed && (
                  <>
                    <span className="truncate max-w-[85px] text-[11px] font-sans tracking-wide">
                      {ws.name}
                    </span>
                    <span className="rounded bg-white/10 px-1 py-0.2 text-[9px] font-mono text-slate-400">
                      {count}
                    </span>
                  </>
                )}
              </button>

              {/* Context Dropdown Button */}
              {!isCollapsed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuWsId(menuWsId === ws.id ? null : ws.id);
                  }}
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-white transition-opacity"
                >
                  <MoreVertical className="w-3 h-3" />
                </button>
              )}

              {/* Context Menu Popup */}
              {menuWsId === ws.id && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 top-full mt-1 z-50 w-44 rounded-xl border border-white/10 bg-[#070b14]/95 p-1 shadow-2xl backdrop-blur-xl"
                >
                  <div className="px-2 py-1 text-[9px] font-mono text-slate-500 uppercase border-b border-white/5">
                    {ws.name}
                  </div>
                  <button
                    onClick={() => {
                      setMenuWsId(null);
                      runicAudio.playClick(450);
                      onHibernateWorkspaceTabs(ws.id);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-slate-300 hover:bg-white/10 hover:text-white"
                  >
                    <Moon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Hibernate Branch</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuWsId(null);
                      runicAudio.playClick(500);
                      onOpenEditModal(ws);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-slate-300 hover:bg-white/10 hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edit Branch</span>
                  </button>
                  {workspaces.length > 1 && (
                    <button
                      onClick={() => {
                        setMenuWsId(null);
                        runicAudio.playClick(300);
                        onDeleteWorkspace(ws.id);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border-t border-white/5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Sever Branch</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Plus Button to add a new realm workspace */}
        <button
          onClick={() => {
            runicAudio.playClick(550);
            onOpenCreateModal();
          }}
          title="Inscribe New Realm Branch"
          className={`flex items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.02] text-slate-400 hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-300 transition-all ${
            isCollapsed ? 'h-8 w-8' : 'h-6 px-1.5'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
