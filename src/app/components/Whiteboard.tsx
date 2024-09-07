"use client";

import { DefaultKeyboardShortcutsDialog, DefaultKeyboardShortcutsDialogContent, DefaultToolbar, DefaultToolbarContent, Editor, TLComponents, Tldraw, TldrawUiMenuItem, TLUiAssetUrlOverrides, TLUiComponents, TLUiOverrides, useEditor, useIsToolSelected, useTools, } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { useTldraw } from "@/app/providers/tldraw-context";
import { useYjsStore } from "@/app/hooks/useYjsStore";

export const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST!;

interface WhiteboardProps {
  roomCode: string;
  children: any;
}

const editorComponents: Required<TLUiComponents> = {
  // Toolbar: null,
  // ContextMenu: null,
  // ActionsMenu: null,
  HelpMenu: null,
  // ZoomMenu: null,
  // MainMenu: null,
  // StylePanel: null,
  // PageMenu: null,
  // NavigationPanel: null,
  // KeyboardShortcutsDialog: null,
  // QuickActions: null,
  // HelperButtons: null,
  SharePanel: null,
  // MenuPanel: null,
  TopPanel: null,
  // CursorChatBubble: null,
  // Toolbar: (props) => {
  //   const tools = useTools()
  //   // // const isStickerSelected = useIsToolSelected(tools['eraser2'])
  //   return (
  //     <DefaultToolbar {...props}>
  //       {/* <TldrawUiMenuItem {...tools['eraser2']} isSelected={isStickerSelected} /> */}
  //       <DefaultToolbarContent />
  //       <div>test</div>
  //     </DefaultToolbar>
  //   )
  //   return null;
  // },
  Minimap: null,
  DebugPanel: null,
  DebugMenu: null,
}

import { StickerTool } from './sticker-tool-util'
const uiOverrides: TLUiOverrides = {
  tools(editor, tools) {
    tools.note = {
      id: 'trash',
      icon: 'trash-icon',
      label: 'Trash',
      onSelect: () => {
        let res = window.confirm("This will clear the entire board, are you sure you want to do this?")
        if (!res) return;
        let allShapes = Array.from(editor.getCurrentPageShapeIds());
        editor.deleteShapes(allShapes);
      }
    }
    return tools
  },
}

// [2]
const components: TLComponents = {
  Toolbar: (props) => {
    const tools = useTools()
    const isStickerSelected = useIsToolSelected(tools['sticker'])
    return (
      <DefaultToolbar {...props}>
        <TldrawUiMenuItem {...tools['sticker']} isSelected={isStickerSelected} />
        <DefaultToolbarContent />
      </DefaultToolbar>
    )
  },
  KeyboardShortcutsDialog: (props) => {
    const tools = useTools()
    return (
      <DefaultKeyboardShortcutsDialog {...props}>
        <DefaultKeyboardShortcutsDialogContent />
        {/* Ideally, we'd interleave this into the tools group */}
        <TldrawUiMenuItem {...tools['sticker']} />
      </DefaultKeyboardShortcutsDialog>
    )
  },
}

// [3]
export const customAssetUrls: TLUiAssetUrlOverrides = {
  icons: {
    'trash-icon': 'https://cdn.tldraw.com/2.4.6/icons/icon/trash.svg',
  },
}

// [4]
const customTools = [StickerTool]


const onlineOnly = <T extends (...args: any[]) => any>(fn: T, store: any) => {
  return (...args: Parameters<T>): ReturnType<T> | undefined => {
    console.warn(store.status);
    if (["error", "synced-local", "not-synced"].indexOf(store.status) > -1) {
      window.alert("You're offline!!!");
      location.reload();
      return undefined;
    }
    if (store.status === "error") {
      window.alert("error state!!")
    }
    return fn(...args);
  };
};

export default function Whiteboard({ roomCode, children }: WhiteboardProps) {
  const { setEditor } = useTldraw();

  const store = useYjsStore({
    roomId: roomCode,
    hostUrl: PARTYKIT_HOST,
  });

  const handleMount = (editor: Editor) => {
    setEditor(editor);
    // // @ts-ignore
    // editor.createShapes = onlineOnly(editor.createShapes.bind(editor), store);
    // // @ts-ignore
    // editor.createShape = onlineOnly(editor.createShape.bind(editor), store);
    // // @ts-ignore
    // editor.deleteShapes = onlineOnly(editor.deleteShapes.bind(editor), store);
    // // @ts-ignore
    // editor.deleteShape = onlineOnly(editor.deleteShape.bind(editor), store);
  };

  return (
    <div className="tldraw__editor">
      <Tldraw
        store={store}
        onMount={handleMount}
        initialState="draw"
        components={editorComponents}
        // tools={customTools}
        overrides={uiOverrides}
        assetUrls={customAssetUrls}
      >
        {children}
      </Tldraw>
    </div >
  );
}
