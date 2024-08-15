"use client";

import { Editor, Tldraw, useEditor } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { useTldraw } from "@/app/providers/tldraw-context";
import { useYjsStore } from "@/app/hooks/useYjsStore";

export const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST!;

interface WhiteboardProps {
  roomCode: string;
}

export default function Whiteboard({ roomCode }: WhiteboardProps) {
  const { setEditor } = useTldraw();

  const store = useYjsStore({
    roomId: roomCode,
    hostUrl: PARTYKIT_HOST,
  });

  const handleMount = (editor: Editor) => {
    setEditor(editor);

    // add code here
    editor.zoomToFit();
  };

  return (
    <div className="tldraw__editor">
      <Tldraw store={store} onMount={handleMount}></Tldraw>
    </div>
  );
}
