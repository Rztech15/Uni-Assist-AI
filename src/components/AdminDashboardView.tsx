import React, { useState, useEffect } from 'react';
import { User, AdminAnalytics, DocumentItem, UserRole } from '../types';
import { safeFetchJson } from '../utils/api';
import {
  ShieldAlert,
  Users,
  FileText,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  RotateCw,
  Search,
  Shield,
  Layers,
  Database,
  BarChart3,
  Menu,
} from 'lucide-react';

interface AdminDashboardViewProps {
  currentUser: User;
  onSwitchToAdminRole: () => void;
  onOpenMobileMenu?: () => void;
  onToggleDesktopSidebar?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  currentUser,
  onSwitchToAdminRole,
  onOpenMobileMenu,
  onToggleDesktopSidebar,
}) => {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [userList, setUserList] = useState<User[]>([]);
  const [docList, setDocList] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  const isAdmin = currentUser.role === 'admin';

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // 1. Analytics
      const dataStats = await safeFetchJson<{ analytics: AdminAnalytics }>('/api/admin/dashboard', {
        headers: { 'x-user-id': currentUser.id },
      });
      if (dataStats.analytics) {
        setAnalytics(dataStats.analytics);
      }

      // 2. Users
      const dataUsers = await safeFetchJson<{ users: User[] }>('/api/admin/users', {
        headers: { 'x-user-id': currentUser.id },
      });
      if (dataUsers.users) {
        setUserList(dataUsers.users);
      }

      // 3. Documents
      const dataDocs = await safeFetchJson<{ documents: DocumentItem[] }>('/api/documents');
      if (dataDocs.documents) {
        setDocList(dataDocs.documents);
      }
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin, currentUser.id]);

  const handleChangeRole = async (targetUserId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${targetUserId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUserList((prev) =>
          prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole as any } : u))
        );
      }
    } catch (e) {
      console.error('Failed to change role:', e);
    }
  };

  // If non-admin user visits
  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-950 text-slate-100">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white">Administrator Access Required</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            You are currently signed in as <strong>{currentUser.fullName}</strong> ({currentUser.role}). Only university administrators can access audit metrics, user roles, and ingestion pipelines.
          </p>
          <div className="pt-2">
            <button
              onClick={onSwitchToAdminRole}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Switch to Administrator Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredUsers = userList.filter(
    (u) =>
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.department.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="p-4 md:p-6 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              aria-label="Open navigation menu"
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          {onToggleDesktopSidebar && (
            <button
              onClick={onToggleDesktopSidebar}
              aria-label="Toggle navigation menu"
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Toggle sidebar menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                University Administration Dashboard
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                Registrar & Super Admin View
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time system telemetry, vector storage health, user permissions, and document ingestion status.
            </p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Refresh Metrics
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Metric Cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Total Users</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">{analytics.totalUsers}</div>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {analytics.activeUsers} Active Accounts
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Knowledge Docs</span>
                <FileText className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white">{analytics.totalDocuments}</div>
              <span className="text-[11px] text-emerald-400">
                {analytics.indexedDocuments} Indexed ({analytics.totalChunks} Chunks)
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Academic Queries</span>
                <MessageSquare className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-white">{analytics.queriesCount}</div>
              <span className="text-[11px] text-slate-400">
                Across {analytics.totalConversations} Dialogues
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Verification Accuracy</span>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-cyan-300">
                {analytics.averageRatingScore}%
              </div>
              <span className="text-[11px] text-slate-400">Student Satisfaction Rating</span>
            </div>
          </div>
        )}

        {/* Ingestion & Repository Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Ingestion Table */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                Repository Document Ingestion Status
              </h2>
              <span className="text-xs text-slate-400">{docList.length} total files</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2 font-medium">Document Title</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">Chunks</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {docList.slice(0, 6).map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 pr-2 font-medium text-slate-200 truncate max-w-xs">
                        {doc.title}
                      </td>
                      <td className="py-2.5 pr-2 text-slate-400">{doc.category}</td>
                      <td className="py-2.5 pr-2 text-cyan-300">{doc.chunkCount}</td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            doc.status === 'indexed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {doc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Document Categories
            </h2>

            {analytics && analytics.categoryBreakdown && (
              <div className="space-y-3">
                {Object.entries(analytics.categoryBreakdown).map(([category, count]) => (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span className="truncate pr-2">{category}</span>
                      <span className="text-cyan-400 font-semibold">{count}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${Math.min(100, (count / analytics.totalDocuments) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User Management Section */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                User & Role Management
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage roles and verify permissions for Students, Faculty, and Administrators.
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search registered users..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2 font-medium">Full Name</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Department</th>
                  <th className="pb-2 font-medium">Current Role</th>
                  <th className="pb-2 font-medium text-right">Assign Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 font-medium text-white">{u.fullName}</td>
                    <td className="py-2.5 text-slate-400 font-mono text-[11px]">{u.email}</td>
                    <td className="py-2.5 text-slate-300">{u.department}</td>
                    <td className="py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : u.role === 'faculty'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.id, e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg text-xs px-2 py-1 text-slate-200 focus:outline-hidden focus:border-blue-500 cursor-pointer"
                      >
                        <option value="student">Student</option>
                        <option value="faculty">Faculty</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
