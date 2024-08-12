import * as React from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { app } from 'state'

export function useKeyboardShortcuts() {
  useHotkeys('command+z,ctrl+z', () => {
    app.undo2()
  })

  useHotkeys('command+shift+z,ctrl+shift+z', () => {
    app.redo2()
  })

  useHotkeys('command+shift+c,ctrl+shift+c', () => {
    app.copyStyles()
  })

  useHotkeys('e,backspace', () => {
    app.resetDoc()
  })
}