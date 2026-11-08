import React from 'react';
import { User, UserRole } from '../types';
import { Shield, GraduationCap, BookOpen, X, Check } from 'lucide-react';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSelectRole: (role: UserRole) => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectRole,
}) => {
  if (!isOpen) return null;

  const roles: Array<{
    role: UserRole;
    title: string;
    description: string;
    icon: any;
    badgeColor: string;
  }> = [
    {
      role: 'student',
      title: 'University Student',
      description: 'Access academic Q&A, exam revision, study planners, course outlines, and bookmarked notes.',
      icon: GraduationCap,
      badgeColor: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
    },
    {
      role: 'faculty',
      title: 'Faculty / Professor',
      description: 'Review course syllabi, verify lecture requirements, and access academic grading guidelines.',
      icon: BookOpen,
      badgeColor: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    },
    {
      role: 'admin',
      title: 'Administrator / Registrar',
      description: 'Upload institutional documents, trigger vector indexing, inspect analytics, and manage user roles.',
      icon: Shield,
      badgeColor: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <h2 className="text-base font-semibold text-white">Switch Active User Role</h2>
            <p className="text-xs text-slate-400">Test different permission levels & access tiers</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {roles.map((item) => {
            const Icon = item.icon;
            const isSelected = currentUser.role === item.role;

            return (
              <button
                key={item.role}
                onClick={() => {
                  onSelectRole(item.role);
                  onClose();
                }}
                className={`w-full flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className={`p-2.5 rounded-xl border shrink-0 ${item.badgeColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {item.title}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-normal">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
