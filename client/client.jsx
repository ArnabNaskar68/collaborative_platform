import React, { useState, useEffect, useRef } from 'react';
import { Users, Copy, Check, Code2 } from 'lucide-react';

export default function CollaborativeCodeEditor() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [code, setCode] = useState('// Start coding together!\n\n');
  const [language, setLanguage] = useState('javascript');
  const [users, setUsers] = useState([]);
  const [copied, setCopied] = useState(false);
  const socketRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    // Initialize Socket.IO connection to your backend
    // For demo purposes, we'll simulate the socket behavior
    const simulateSocket = {
      emit: (event, data) => {
        console.log('Emitting:', event, data);
      },
      on: (event, callback) => {
        console.log('Listening to:', event);
      },
      off: (event) => {
        console.log('Removing listener:', event);
      }
    };
    
    socketRef.current = simulateSocket;

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-room');
      }
    };
  }, []);

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createRoom = () => {
    if (!username.trim()) {
      alert('Please enter your name');
      return;
    }
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    joinRoom(newRoomId);
  };

  const joinRoom = (room = roomId) => {
    if (!username.trim() || !room.trim()) {
      alert('Please enter your name and room ID');
      return;
    }

    // In a real implementation, emit to socket
    socketRef.current.emit('join-room', {
      roomId: room,
      username: username
    });

    setIsJoined(true);
    setUsers([{ id: '1', name: username }]);

    // Listen for code changes
    socketRef.current.on('code-change', ({ code: newCode }) => {
      setCode(newCode);
    });

    // Listen for language changes
    socketRef.current.on('language-change', ({ language: newLang }) => {
      setLanguage(newLang);
    });

    // Listen for user updates
    socketRef.current.on('user-joined', ({ users: updatedUsers }) => {
      setUsers(updatedUsers);
    });

    socketRef.current.on('user-left', ({ users: updatedUsers }) => {
      setUsers(updatedUsers);
    });
  };

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    
    // Emit code change to other users
    if (socketRef.current && isJoined) {
      socketRef.current.emit('code-change', {
        roomId,
        code: newCode
      });
    }
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    
    // Emit language change to other users
    if (socketRef.current && isJoined) {
      socketRef.current.emit('language-change', {
        roomId,
        language: newLang
      });
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const leaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', { roomId });
      socketRef.current.off('code-change');
      socketRef.current.off('language-change');
      socketRef.current.off('user-joined');
      socketRef.current.off('user-left');
    }
    setIsJoined(false);
    setRoomId('');
    setCode('// Start coding together!\n\n');
    setUsers([]);
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-700">
          <div className="flex items-center justify-center mb-6">
            <Code2 className="w-12 h-12 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-white text-center mb-2">
            Collaborative Code Editor
          </h1>
          <p className="text-slate-400 text-center mb-8">
            Code together in real-time
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Room ID (optional)
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="Enter room ID to join"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={createRoom}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Create Room
              </button>
              <button
                onClick={() => joinRoom()}
                disabled={!roomId.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Code2 className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-white font-semibold">Room: {roomId}</h2>
              <button
                onClick={copyRoomId}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-300 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy ID
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={language}
              onChange={handleLanguageChange}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
            </select>

            <div className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-white text-sm">{users.length}</span>
            </div>

            <button
              onClick={leaveRoom}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Leave
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar with users */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-slate-800 border-r border-slate-700 p-4 overflow-y-auto">
          <h3 className="text-slate-300 font-semibold mb-3 text-sm uppercase tracking-wide">
            Active Users
          </h3>
          <div className="space-y-2">
            {users.map((user, index) => (
              <div
                key={user.id}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: `hsl(${index * 137.5}, 70%, 60%)`
                  }}
                />
                <span className="text-white text-sm">{user.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex flex-col">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleCodeChange}
            className="flex-1 bg-slate-900 text-slate-100 p-6 font-mono text-sm resize-none focus:outline-none"
            placeholder="Start typing your code..."
            spellCheck="false"
          />
        </div>
      </div>
    </div>
  );
}