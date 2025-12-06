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
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    if (!roomId || !userName) return;

    // Connect to Socket.IO server
    socketRef.current = io('http://localhost:3000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      console.log('✓ Connected to collaboration server');
      socketRef.current.emit('join-room', { roomId, userName });
    });

    socketRef.current.on('disconnect', () => {
      console.log('✗ Disconnected from server');
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Receive document updates
    socketRef.current.on('doc-update', (data) => {
      console.log('📝 Doc update received:', { version: data.version, contentLength: data.content.length });
      setDocContent(data.content);
      setVersion(data.version);
      if (data.users) {
        setUsers(data.users);
      }
    });

    // Receive user joined notification
    socketRef.current.on('user-joined', (data) => {
      console.log('👥 User joined:', data.userName);
      setUsers(data.users);
    });

    // Receive user left notification
    socketRef.current.on('user-left', (data) => {
      console.log('👋 User left:', data.userName);
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

  // Emit document changes with debouncing
  const updateDoc = (content) => {
    setDocContent(content);
    
    // Clear existing timer
    clearTimeout(debounceTimerRef.current);

    // Debounce: wait 300ms before sending to avoid spam
    debounceTimerRef.current = setTimeout(() => {
      if (socketRef.current?.connected) {
        console.log('📤 Sending doc update:', { contentLength: content.length });
        socketRef.current.emit('doc-change', {
          roomId,
          change: { content },
          version: version + 1, // Use current version directly
        });
        // Update version after sending
        setVersion(prev => prev + 1);
      } else {
        console.warn('⚠️ Socket not connected, queuing update...');
      }
    }, 300);
  };

  // Emit cursor position
  const updateCursor = (position) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('cursor-move', {
        roomId,
        position,
      });
    }
  };

  // Emit typing status
  const setTyping = (isTyping) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('user-typing', {
        roomId,
        isTyping,
      });

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