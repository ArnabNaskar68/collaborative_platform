import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

const CollaborationContext = createContext();

export function CollaborationProvider({ children, roomId, userName }) {
  const [docContent, setDocContent] = useState('');
  const [users, setUsers] = useState([]);
  const [cursors, setCursors] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [version, setVersion] = useState(0);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!roomId || !userName) return;

    // Connect to Socket.IO server
    socketRef.current = io('http://localhost:3000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to collaboration server');
      // Join the room
      socketRef.current.emit('join-room', { roomId, userName });
    });

    // Receive document updates
    socketRef.current.on('doc-update', (data) => {
      setDocContent(data.content);
      setVersion(data.version);
      if (data.users) {
        setUsers(data.users);
      }
    });

    // Receive user joined notification
    socketRef.current.on('user-joined', (data) => {
      setUsers(data.users);
    });

    // Receive user left notification
    socketRef.current.on('user-left', (data) => {
      setUsers(data.users);
    });

    // Receive cursor updates
    socketRef.current.on('cursor-update', (data) => {
      setCursors((prev) => ({
        ...prev,
        [data.userId]: {
          name: data.userName,
          position: data.position,
        },
      }));
    });

    // Receive typing status
    socketRef.current.on('typing-status', (data) => {
      if (data.isTyping) {
        setTypingUsers((prev) => ({
          ...prev,
          [data.userId]: data.userName,
        }));
      } else {
        setTypingUsers((prev) => {
          const updated = { ...prev };
          delete updated[data.userId];
          return updated;
        });
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-room', roomId);
        socketRef.current.disconnect();
      }
    };
  }, [roomId, userName]);

  // Emit document changes
  const updateDoc = (content) => {
    setDocContent(content);
    const newVersion = version + 1;
    setVersion(newVersion);
    if (socketRef.current) {
      socketRef.current.emit('doc-change', {
        roomId,
        change: { content },
        version: newVersion,
      });
    }
  };

  // Emit cursor position
  const updateCursor = (position) => {
    if (socketRef.current) {
      socketRef.current.emit('cursor-move', {
        roomId,
        position,
      });
    }
  };

  // Emit typing status
  const setTyping = (isTyping) => {
    if (socketRef.current) {
      socketRef.current.emit('user-typing', {
        roomId,
        isTyping,
      });

      // Auto-stop typing after 2 seconds of inactivity
      clearTimeout(typingTimeoutRef.current);
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          socketRef.current?.emit('user-typing', { roomId, isTyping: false });
        }, 2000);
      }
    }
  };

  return (
    <CollaborationContext.Provider
      value={{
        docContent,
        updateDoc,
        users,
        cursors,
        updateCursor,
        typingUsers,
        setTyping,
        version,
      }}
    >
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaboration() {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within CollaborationProvider');
  }
  return context;
}