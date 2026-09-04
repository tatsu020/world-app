import { createContext, ReactNode, useContext, useState } from 'react'
import { BottomSheet, OverlaySurface } from '@concrnt/ui'
import { useKeyboard } from '../contexts/Keyboard'

const DrawerDismissBlockContext = createContext<(blocked: boolean) => void>(() => {})

export const useDrawerDismissBlock = () => useContext(DrawerDismissBlockContext)

interface Props {
    open: boolean
    onClose: () => void | boolean
    children: ReactNode
}

export const Drawer = (props: Props) => {
    const keyboard = useKeyboard()
    const [dismissBlocked, setDismissBlocked] = useState(false)
    const requestClose = () => {
        if (dismissBlocked) return false
        return props.onClose()
    }

    return (
        <OverlaySurface open={props.open} onClose={requestClose}>
            <BottomSheet height={window.innerHeight * 0.9} keyboardInset={keyboard} onDismiss={requestClose}>
                <DrawerDismissBlockContext.Provider value={setDismissBlocked}>
                    {props.children}
                </DrawerDismissBlockContext.Provider>
            </BottomSheet>
        </OverlaySurface>
    )
}
