'use client'

import { FC, useEffect, useState, useRef } from 'react'
import { Editor } from '../../components/editor'
import { Controls } from '../../components/controls'
import { Panel } from '../../components/panel'
import { useKeyboardShortcuts } from '../../hooks'

interface pageProps { }

const page: FC<pageProps> = ({ }) => {
    useKeyboardShortcuts();
    return (
        <div className='w-screen pt-12 bg-white flex flex-col justify-center items-center gap-10'>
            <Editor />
            <Controls />
            <Panel />
        </div>
    )
}

export default page
