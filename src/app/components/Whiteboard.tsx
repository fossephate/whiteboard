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

const components: Required<TLUiComponents> = {
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



// import {Eraser2Tool} from "./EraserTool";


// // [1]
// const uiOverrides: TLUiOverrides = {
//   tools(editor, tools) {
//     // Create a tool item in the ui's context.
//     tools.eraser2 = {
//       id: 'sticker',
//       icon: 'heart-icon',
//       label: 'Eraser2',
//       kbd: 'e',
//       onSelect: () => {
//         editor.setCurrentTool('sticker')
//       },
//     }
//     return tools
//   },
// }

// // [2]
// const components: TLComponents = {
//   Toolbar: (props) => {
//     const tools = useTools()
//     const isStickerSelected = useIsToolSelected(tools['eraser2'])
//     return (
//       <DefaultToolbar {...props}>
//         <TldrawUiMenuItem {...tools['eraser2']} isSelected={isStickerSelected} />
//         <DefaultToolbarContent />
//       </DefaultToolbar>
//     )
//   },
//   KeyboardShortcutsDialog: (props) => {
//     const tools = useTools()
//     return (
//       <DefaultKeyboardShortcutsDialog {...props}>
//         <DefaultKeyboardShortcutsDialogContent />
//         {/* Ideally, we'd interleave this into the tools group */}
//         <TldrawUiMenuItem {...tools['eraser2']} />
//       </DefaultKeyboardShortcutsDialog>
//     )
//   },
// }

// // [3]
// export const customAssetUrls: TLUiAssetUrlOverrides = {
// 	icons: {
// 		'heart-icon': '/heart-icon.svg',
// 	},
// }


// // [4]
// const customTools = [Eraser2Tool]

export default function Whiteboard({ roomCode, children }: WhiteboardProps) {
  const { setEditor } = useTldraw();

  const store = useYjsStore({
    roomId: roomCode,
    hostUrl: PARTYKIT_HOST,
  });

  const handleMount = (editor: Editor) => {
    setEditor(editor);

    // add code here
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) {
      editor.zoomToFit();
      editor.zoomOut();
    }
  };

  return (
    <div className="tldraw__editor">
      <Tldraw
        store={store}
        onMount={handleMount}
        initialState="draw"
        components={components}
        // tools={customTools}
        >
        {children}
      </Tldraw>
    </div >
  );
}
