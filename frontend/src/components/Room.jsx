import React from 'react';
import { useLocation } from 'react-router-dom';

export default function Room() {
  const location = useLocation();
  const roomData = location.state || null;

  return (
    <div className="flex h-screen">
      {/* Left pane (like VS Code Explorer) ~ 25% width */}
      <aside className="w-1/4 min-w-[220px] bg-slate-900 text-slate-100 border-r border-slate-800 overflow-y-auto">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold">Explorer</h2>
        </div>

        <nav className="p-4 space-y-2">
          <div className="text-xs text-slate-400 uppercase mb-2">Workspace</div>

          <ul className="space-y-1">
            <li className="px-3 py-2 rounded-md hover:bg-slate-800 cursor-pointer">
              <span className="font-medium">src</span>
            </li>
            <li className="px-3 py-2 rounded-md hover:bg-slate-800 cursor-pointer">
              <span className="font-medium">components</span>
            </li>
            <li className="px-3 py-2 rounded-md hover:bg-slate-800 cursor-pointer">
              <span className="font-medium">App.jsx</span>
            </li>
            <li className="px-3 py-2 rounded-md hover:bg-slate-800 cursor-pointer">
              <span className="font-medium">Room.jsx</span>
            </li>
          </ul>

          <div className="mt-6 text-xs text-slate-500">Open Editors</div>
          <div className="mt-2 space-y-1">
            <div className="px-3 py-2 rounded-md bg-slate-800">App.jsx</div>
          </div>
        </nav>
      </aside>

      {/* Right pane (editor) ~ 75% width */}
      <main className="flex-1 bg-slate-50 overflow-auto">
        <div className="h-full">
          <header className="px-6 py-4 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-slate-700">Room</h1>
              <div className="text-sm text-slate-500">Room ID: ABC123</div>
            </div>
          </header>

          <section className="p-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 h-[70vh] overflow-auto">
              <div className="p-4">
                <pre className="whitespace-pre-wrap text-sm text-slate-800">
{`// This is the editor area — like VS Code's editor
// Replace this with your real editor (Monaco, CodeMirror, textarea, etc.)

function hello() {
  console.log("Hello from the Room editor");
}`}
                </pre>
              </div>
            </div>
          </section>

          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-semibold mb-4">Room</h1>

            {roomData ? (
              <div className="space-y-2">
                <div><strong>Name:</strong> {roomData.Name}</div>
                <div><strong>Room ID:</strong> {roomData.RoomId}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                No room data provided. You can navigate here directly or via the Home form.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}