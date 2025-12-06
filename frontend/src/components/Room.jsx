import React from 'react';
import { useLocation } from 'react-router-dom';
import { CollaborationProvider } from '../context/CollaborationContext';
import ProseMirrorEditor from './proseMirrorEditor';
import { useCollaboration } from '../context/CollaborationContext';

function RoomContent() {
  const { users, typingUsers, cursors } = useCollaboration();

  return (
    <div className="flex h-screen">
      {/* Sidebar - Active Users */}
      <aside className="w-1/4 min-w-[220px] bg-slate-900 text-slate-100 border-r border-slate-800 overflow-y-auto">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold">Users ({users.length})</h2>
        </div>

        <nav className="p-4 space-y-2">
          {users.map((user) => (
            <div key={user.id} className="p-3 bg-slate-800 rounded-lg">
              <div className="font-medium text-sm">{user.name}</div>
              <div className="text-xs text-green-400">● Online</div>
              {typingUsers[user.id] && (
                <div className="text-xs text-yellow-300 mt-1">typing...</div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Editor */}
      <main className="flex-1 bg-slate-50 overflow-auto">
        <header className="px-6 py-4 border-b border-slate-200 bg-white sticky top-0">
          <h1 className="text-lg font-semibold text-slate-700">Collaborative Editor</h1>
        </header>

        <section className="p-6 h-[calc(100%-72px)]">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 h-full">
            <ProseMirrorEditor />
          </div>
        </section>
      </main>
    </div>
  );
}

export default function Room() {
  const location = useLocation();
  const roomData = location.state || {};
  const { RoomId, Name } = roomData;

  if (!RoomId || !Name) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="text-gray-600 mt-2">Missing room data. Please join a room first.</p>
        </div>
      </div>
    );
  }

  return (
    <CollaborationProvider roomId={RoomId} userName={Name}>
      <RoomContent />
    </CollaborationProvider>
  );
}