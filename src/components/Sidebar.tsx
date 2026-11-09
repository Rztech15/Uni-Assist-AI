import React, { useState } from 'react';
import {
  Conversation,
  User,
} from '../types';
import {
  MessageSquarePlus,
  BookOpen,
  GraduationCap,
  FileText,
  Bookmark,
  Shield,
  Settings,
  HelpCircle,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Menu,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogIn,
  LogOut,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  currentUser: User | null;
  onOpenRoleSwitcher: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  currentUser,
  onOpenRoleSwitcher,
  onOpenSettings,
  onOpenHelp,
  onOpenAuth,
  onLogout,
  isCollapsed,
  onToggleCollapse,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const confirmRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      onDeleteConversation(id);
    }
  };

  const handleNavClick = (tab: string) => {
    if (tab === 'new_chat') {
      onNewChat();
      onSelectTab('chat');
    } else {
      onSelectTab(tab);
    }
    if (isOpenMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand Header with Collapsible Hamburger Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isCollapsed ? 'Expand menu' : 'Collapse menu'}
            >
              <Menu className="w-5 h-5 text-slate-300" />
            </button>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-bold text-white tracking-tight truncate">
                    UniAssist AI
                  </h1>
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    RAG
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  Metropolitan University
                </p>
              </div>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* 5-Item Navigation Menu as requested */}
        <div className="p-3 space-y-1.5">
          {/* 1. New Chat */}
          <button
            onClick={() => handleNavClick('new_chat')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
              currentTab === 'chat' && !activeConversationId
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 hover:text-white border border-blue-500/30'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
            title="Start New Chat"
          >
            <MessageSquarePlus className="w-4 h-4 shrink-0 text-cyan-300" />
            {!isCollapsed && (
              <div className="flex items-center justify-between flex-1 text-xs">
                <span className="font-semibold">1. New Chat</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/30 text-white font-medium">
                  Fresh
                </span>
              </div>
            )}
          </button>

          {/* 2. Study Assistant */}
          <button
            onClick={() => handleNavClick('study')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              currentTab === 'study'
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-xs'
                : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
            title="Study Assistant & Exam Prep"
          >
            <BookOpen className="w-4 h-4 shrink-0 text-amber-400" />
            {!isCollapsed && (
              <div className="flex items-center justify-between flex-1">
                <span>2. Study Assistant</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                  Exam Prep
                </span>
              </div>
            )}
          </button>

          {/* 3. Knowledge Base */}
          <button
            onClick={() => handleNavClick('knowledge')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              currentTab === 'knowledge'
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-xs'
                : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
            title="University Knowledge Base"
          >
            <FileText className="w-4 h-4 shrink-0 text-emerald-400" />
            {!isCollapsed && (
              <div className="flex items-center justify-between flex-1">
                <span>3. Knowledge Base</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                  Docs
                </span>
              </div>
            )}
          </button>

          {/* 4. Saved Responses */}
          <button
            onClick={() => handleNavClick('saved')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              currentTab === 'saved'
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-xs'
                : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
            title="Saved Responses & Notes"
          >
            <Bookmark className="w-4 h-4 shrink-0 text-indigo-400" />
            {!isCollapsed && (
              <div className="flex items-center justify-between flex-1">
                <span>4. Saved Responses</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                  Notes
                </span>
              </div>
            )}
          </button>

          {/* 5. Admin Dashboard */}
          <button
            onClick={() => handleNavClick('admin')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              currentTab === 'admin'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs'
                : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
            title="Admin Dashboard"
          >
            <Shield className="w-4 h-4 shrink-0 text-rose-400" />
            {!isCollapsed && (
              <div className="flex items-center justify-between flex-1">
                <span>5. Admin Dashboard</span>
                {currentUser?.role === 'admin' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold">
                    Admin
                  </span>
                )}
              </div>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="mx-3 my-1 border-t border-slate-800" />

        {/* Chat History Section */}
        {!isCollapsed && (
          <div className="flex-1 flex flex-col min-h-0 px-3">
            <div className="flex items-center justify-between py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <span>Chat History</span>
              <span className="text-[10px] text-slate-500">{conversations.length}</span>
            </div>

            {/* Search conversations */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  {searchQuery ? 'No matching chats' : 'No conversations yet'}
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isActive = conv.id === activeConversationId && currentTab === 'chat';
                  const isEditing = conv.id === editingId;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        onSelectConversation(conv.id);
                        if (currentTab !== 'chat') onSelectTab('chat');
                        if (isOpenMobile) onCloseMobile();
                      }}
                      className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-blue-950/60 text-blue-200 border border-blue-600/40 font-medium'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      {isEditing ? (
                        <div
                          className="flex items-center gap-1 w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="flex-1 px-2 py-1 text-xs bg-slate-950 border border-blue-500 rounded text-white focus:outline-hidden"
                            autoFocus
                          />
                          <button
                            onClick={(e) => confirmRename(conv.id, e)}
                            className="p-1 hover:text-emerald-400"
                            title="Save title"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelRename}
                            className="p-1 hover:text-rose-400"
                            title="Cancel rename"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="truncate">{conv.title}</p>
                            <span className="text-[10px] text-slate-500 block truncate">
                              {new Date(conv.updatedAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="hidden group-hover:flex items-center gap-0.5 text-slate-400">
                            <button
                              onClick={(e) => startRename(conv, e)}
                              className="p-1 hover:text-white rounded"
                              title="Rename chat"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(conv.id, e)}
                              className="p-1 hover:text-rose-400 rounded"
                              title="Delete chat"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Footer: User profile & quick role switch */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/90 space-y-2">
          {/* Quick links */}
          <div className="flex items-center justify-around text-slate-400 text-xs pb-1">
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
              title="Settings & Language"
            >
              <Settings className="w-4 h-4" />
              {!isCollapsed && <span>Settings</span>}
            </button>
            <button
              onClick={onOpenHelp}
              className="flex items-center gap-1.5 p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
              title="Help & Institutional Support"
            >
              <HelpCircle className="w-4 h-4" />
              {!isCollapsed && <span>Help</span>}
            </button>
          </div>

          {/* User profile card or Sign In Button */}
          {currentUser ? (
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div
                onClick={onOpenRoleSwitcher}
                className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
                title="Click to switch role (Student / Faculty / Admin)"
              >
                <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {currentUser.fullName.charAt(0)}
                </div>
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-white truncate">
                        {currentUser.fullName}
                      </p>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                          currentUser.role === 'admin'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : currentUser.role === 'faculty'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}
                      >
                        {currentUser.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      {currentUser.department}
                    </p>
                  </div>
                )}
              </div>

              {/* Account Switch & Logout Buttons */}
              {!isCollapsed && (
                <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 hover:text-white text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
                    title="Sign In or Switch User"
                  >
                    <LogIn className="w-3 h-3" />
                    <span>Switch Account</span>
                  </button>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-400 text-xs transition-colors"
                    title="Log out and reset session"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={onOpenAuth}
                className={`w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/30 transition-all ${
                  isCollapsed ? 'px-0' : ''
                }`}
              >
                <LogIn className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Sign In</span>}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
