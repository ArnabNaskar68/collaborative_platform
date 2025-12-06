import { useEffect, useRef } from 'react';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { useCollaboration } from '../context/CollaborationContext';
import 'prosemirror-view/style/prosemirror.css';

export default function ProseMirrorEditor() {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const isRemoteChangeRef = useRef(false);
  const lastDocContentRef = useRef('');
  const { docContent, updateDoc, setTyping, updateCursor } = useCollaboration();

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      schema: basicSchema,
      plugins: [
        history(),
        keymap(baseKeymap),
      ],
    });

    viewRef.current = new EditorView(editorRef.current, {
      state,
      editable: () => true,
      dispatchTransaction(transaction) {
        const view = viewRef.current;
        const newState = view.state.apply(transaction);
        view.updateState(newState);

        if (!isRemoteChangeRef.current) {
          const content = newState.doc.textContent;
          lastDocContentRef.current = content;
          updateDoc(content);
          setTyping(true);
        }

        isRemoteChangeRef.current = false;
        updateCursor(newState.selection.from);
      },
    });

    viewRef.current.focus();

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, []);

  // Update editor when remote changes arrive
  useEffect(() => {
    if (!viewRef.current) return;

    const currentContent = viewRef.current.state.doc.textContent;
    
    // Only update if content changed and it's not our own change
    if (docContent !== currentContent && docContent !== lastDocContentRef.current) {
      console.log('🔄 Syncing remote changes:', { currentLength: currentContent.length, newLength: docContent.length });
      
      isRemoteChangeRef.current = true;
      lastDocContentRef.current = docContent;

      try {
        const doc = basicSchema.topNodeType.createAndFill(
          null,
          basicSchema.text(docContent)
        );
        
        const newState = EditorState.create({
          schema: basicSchema,
          doc,
          plugins: [
            history(),
            keymap(baseKeymap),
          ],
        });
        
        viewRef.current.updateState(newState);
        console.log('✓ Content synced');
      } catch (error) {
        console.error('Error syncing content:', error);
      }
    }
  }, [docContent]);

  return (
    <div className="prosemirror-wrapper h-full w-full overflow-auto">
      <div ref={editorRef} className="h-full w-full" />
    </div>
  );
}