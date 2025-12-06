import React, { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { ySyncPlugin, yCursorPlugin, yUndoPlugin } from 'y-prosemirror';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import 'prosemirror-view/style/prosemirror.css';

export default function ProseMirrorEditor({ roomId = 'default-room', userName = 'Anonymous' }) {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const providerRef = useRef(null);
  const ydocRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) return;

    // Create Yjs doc and websocket provider
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Connect to local y-websocket server. Adjust URL if needed.
    const provider = new WebsocketProvider('ws://localhost:1234', roomId, ydoc);
    providerRef.current = provider;

    // Share an XML fragment for ProseMirror
    const yXmlFragment = ydoc.get('prosemirror', Y.XmlFragment);

    // Set presence / awareness (so yCursorPlugin can show cursors)
    provider.awareness.setLocalStateField('user', {
      name: userName,
      color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'),
    });

    // Build editor state with Yjs plugins
    const state = EditorState.create({
      schema: basicSchema,
      plugins: [
        ySyncPlugin(yXmlFragment),            // sync with Yjs
        yCursorPlugin(provider.awareness),    // remote cursors
        yUndoPlugin(),                        // undo/redo binding
        history(),
        keymap(baseKeymap),
        keymap({ 'Mod-z': () => { /* will be handled by yUndoPlugin */ }, 'Mod-y': () => {} }),
      ],
    });

    // Create EditorView
    viewRef.current = new EditorView(editorRef.current, {
      state,
      editable: () => true,
    });

    // Focus so typing works
    viewRef.current.focus();

    return () => {
      // cleanup
      try {
        viewRef.current?.destroy();
        provider.destroy();
        ydoc.destroy();
      } catch (e) {
        console.warn('cleanup error', e);
      }
      viewRef.current = null;
      providerRef.current = null;
      ydocRef.current = null;
    };
  }, [roomId, userName]);

  return (
    <div className="prosemirror-wrapper h-full w-full overflow-auto bg-white">
      <div ref={editorRef} className="h-full w-full p-4" />
    </div>
  );
}