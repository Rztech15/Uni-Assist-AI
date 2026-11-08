import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Conversation,
  Message,
  Citation,
  UserRole,
} from './types';
import { Sidebar } from './components/Sidebar';
import { ChatWorkspace } from './components/ChatWorkspace';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { StudyAssistantView } from './components/StudyAssistantView';
import { SavedResponsesView } from './components/SavedResponsesView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { CitationsModal } from './components/CitationsModal';
import { RoleSwitcherModal } from './components/RoleSwitcherModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { HelpSupportModal } from './components/HelpSupportModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { safeFetchJson } from './utils/api.ts';

export default function App() {
  // Current active user
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user-student-1',
    fullName: 'Bilal Ahmed',
    email: 'bilal.student@uniassist.edu',
    role: 'student',
    department: 'Computer Science',
    university: 'UniAssist Metropolitan University',
    createdAt: new Date().toISOString(),
  });

  // App Navigation Tab
  const [currentTab, setCurrentTab] = useState<string>('chat');

  // Conversations and Messages
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set());

  // Modals & Panels
  const [activeCitations, setActiveCitations] = useState<Citation[]>([]);
  const [isCitationsModalOpen, setIsCitationsModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Layout UI
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [appLanguage, setAppLanguage] = useState<'en' | 'ur' | 'roman_ur'>('en');

  // Load User and Conversations on mount
  useEffect(() => {
    const savedUserId = localStorage.getItem('uniassist_user_id') || currentUser.id;
    loadUserAndConversations(savedUserId);
  }, []);

  const loadUserAndConversations = async (userIdToLoad?: string) => {
    const uid = userIdToLoad || currentUser.id;
    try {
      // 1. Fetch user profile
      try {
        const dataUser = await safeFetchJson<{ user: User }>('/api/auth/me', {
          headers: { 'x-user-id': uid },
        });
        if (dataUser.user) {
          setCurrentUser(dataUser.user);
          localStorage.setItem('uniassist_user_id', dataUser.user.id);
        }
      } catch (e) {
        console.warn('User profile check:', e);
      }

      // 2. Fetch conversations for this user
      try {
        const dataConvs = await safeFetchJson<{ conversations: Conversation[] }>('/api/conversations', {
          headers: { 'x-user-id': uid },
        });
        if (dataConvs.conversations) {
          setConversations(dataConvs.conversations);
          if (dataConvs.conversations.length > 0) {
            selectConversation(dataConvs.conversations[0].id);
          } else {
            setActiveConversationId(null);
            setMessages([]);
          }
        }
      } catch (e) {
        console.warn('Conversations check:', e);
      }

      // 3. Fetch saved responses
      try {
        const dataSaved = await safeFetchJson<{ savedResponses: any[] }>('/api/saved', {
          headers: { 'x-user-id': uid },
        });
        if (dataSaved.savedResponses) {
          const ids = new Set<string>(dataSaved.savedResponses.map((s: any) => s.messageId));
          setSavedMessageIds(ids);
        }
      } catch (e) {
        console.warn('Saved responses check:', e);
      }
    } catch (err) {
      console.error('Failed to load user and conversations:', err);
    }
  };

  const handleLoginSuccess = async (newUser: User) => {
    setCurrentUser(newUser);
    localStorage.setItem('uniassist_user_id', newUser.id);
    setActiveConversationId(null);
    setMessages([]);
    await loadUserAndConversations(newUser.id);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('uniassist_user_id');
    const defaultStudent: User = {
      id: 'user-student-1',
      fullName: 'Bilal Ahmed',
      email: 'bilal.student@uniassist.edu',
      role: 'student',
      department: 'Computer Science',
      university: 'UniAssist Metropolitan University',
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(defaultStudent);
    setActiveConversationId(null);
    setMessages([]);
    await loadUserAndConversations(defaultStudent.id);
    setIsAuthModalOpen(true);
  };

  // Select a conversation and load its messages
  const selectConversation = async (convId: string) => {
    setActiveConversationId(convId);
    try {
      const data = await safeFetchJson<{ messages: Message[] }>(`/api/conversations/${convId}`);
      setMessages(data.messages || []);
    } catch (e) {
      console.error('Failed to fetch messages for conversation:', e);
    }
  };

  // Start a new clean conversation
  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setCurrentTab('chat');
  };

  // Rename a conversation
  const handleRenameConversation = async (convId: string, newTitle: string) => {
    try {
      const res = await fetch(`/api/conversations/${convId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, title: newTitle } : c))
        );
      }
    } catch (e) {
      console.error('Failed to rename conversation:', e);
    }
  };

  // Delete a conversation
  const handleDeleteConversation = async (convId: string) => {
    try {
      const res = await fetch(`/api/conversations/${convId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== convId));
        if (activeConversationId === convId) {
          handleNewChat();
        }
      }
    } catch (e) {
      console.error('Failed to delete conversation:', e);
    }
  };

  // Send Chat Message
  const handleSendMessage = async (text: string, language: 'en' | 'ur' | 'roman_ur' = appLanguage) => {
    if (!text.trim() || isLoading) return;

    // Optimistic UI for User message
    const tempUserMsg: Message = {
      id: `temp-user-${Date.now()}`,
      conversationId: activeConversationId || 'pending',
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
      language,
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const data = await safeFetchJson('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          message: text,
          conversationId: activeConversationId,
          language,
        }),
      });

      // Update active conversation ID if newly created
      if (!activeConversationId && data.conversationId) {
        setActiveConversationId(data.conversationId);
      }

      // Replace with real persisted messages
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        data.userMessage,
        data.assistantMessage,
      ]);

      // Refresh conversation list to get latest title & snippet
      const convsData = await safeFetchJson<{ conversations: Conversation[] }>('/api/conversations', {
        headers: { 'x-user-id': currentUser.id },
      });
      setConversations(convsData.conversations || []);
    } catch (err: any) {
      console.error('Send message failed:', err);
      // Append fallback error assistant message
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        conversationId: activeConversationId || 'error',
        role: 'assistant',
        content: `**System Notice:** Could not reach the AI service. ${err.message || 'Please check your connection and retry.'}`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Stop Generation
  const handleStopGeneration = () => {
    setIsLoading(false);
  };

  // Regenerate last assistant response
  const handleRegenerate = () => {
    const userMsgs = messages.filter((m) => m.role === 'user');
    if (userMsgs.length > 0) {
      const lastUser = userMsgs[userMsgs.length - 1];
      // Pop last assistant message and resend query
      setMessages((prev) => prev.slice(0, prev.length - 1));
      handleSendMessage(lastUser.content);
    }
  };

  // Bookmark / Save response
  const handleSaveMessage = async (msg: Message) => {
    try {
      const lastUserQuery =
        messages.slice(0, messages.indexOf(msg)).reverse().find((m) => m.role === 'user')?.content ||
        'Academic Query';

      const res = await fetch('/api/saved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          messageId: msg.id,
          query: lastUserQuery,
          answer: msg.content,
          citations: msg.citations,
        }),
      });

      if (res.ok) {
        setSavedMessageIds((prev) => new Set(prev).add(msg.id));
      }
    } catch (e) {
      console.error('Failed to save response:', e);
    }
  };

  // Submit Feedback rating
  const handleFeedback = async (messageId: string, rating: 'like' | 'dislike', comment?: string) => {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ messageId, rating, comments: comment }),
      });
      // Update local message rating
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, rating } : m))
      );
    } catch (e) {
      console.error('Failed to record feedback:', e);
    }
  };

  // Switch role handler (e.g. switch to Admin or Faculty)
  const handleSelectRole = async (role: UserRole) => {
    try {
      const data = await safeFetchJson<{ user: User }>('/api/auth/switch-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ role }),
      });
      if (data.user) {
        setCurrentUser(data.user);
      }
    } catch (e) {
      console.error('Failed to switch role:', e);
    }
  };

  // View Citations Modal
  const handleOpenCitations = (citations: Citation[]) => {
    setActiveCitations(citations);
    setIsCitationsModalOpen(true);
  };

  // Active conversation object
  const currentConversation =
    conversations.find((c) => c.id === activeConversationId) || null;



  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans antialiased text-slate-100">
      {/* Collapsible Responsive Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={selectConversation}
        onNewChat={handleNewChat}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        currentUser={currentUser}
        onOpenRoleSwitcher={() => setIsRoleModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {currentTab === 'chat' && (
          <ChatWorkspace
            conversation={currentConversation}
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onStopGeneration={handleStopGeneration}
            onRegenerate={handleRegenerate}
            onSaveMessage={handleSaveMessage}
            onOpenCitations={handleOpenCitations}
            onFeedback={handleFeedback}
            savedMessageIds={savedMessageIds}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onSelectPrompt={(promptText) => handleSendMessage(promptText)}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'knowledge' && (
          <KnowledgeBaseView
            currentUser={currentUser}
            onRefreshDocs={loadUserAndConversations}
          />
        )}

        {currentTab === 'study' && (
          <StudyAssistantView currentUser={currentUser} />
        )}

        {currentTab === 'saved' && (
          <SavedResponsesView
            currentUser={currentUser}
            onOpenCitations={handleOpenCitations}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDashboardView
            currentUser={currentUser}
            onSwitchToAdminRole={() => handleSelectRole('admin')}
          />
        )}
      </main>

      {/* Citations Reference Modal */}
      <CitationsModal
        citations={activeCitations}
        isOpen={isCitationsModalOpen}
        onClose={() => setIsCitationsModalOpen(false)}
      />

      {/* Role Switcher Modal */}
      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentUser={currentUser}
        onSelectRole={handleSelectRole}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        language={appLanguage}
        onLanguageChange={setAppLanguage}
      />

      {/* Help & Support Modal */}
      <HelpSupportModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* Sign In & User Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
