import { createContext, ReactNode, useContext, useState } from 'react'
import { OverlaySurface, SideSheet } from '@concrnt/ui'

const DrawerDismissBlockContext = createContext<(blocked: boolean) => void>(() => {})

export const useDrawerDismissBlock = () => useContext(DrawerDismissBlockContext)

interface Props {
    open: boolean
    onClose: () => void
    children: ReactNode
}

export const Drawer = (props: Props) => {
    const [dismissBlocked, setDismissBlocked] = useState(false)
    const requestClose = () => {
        if (dismissBlocked) return
        props.onClose()
    }

    return (
        <OverlaySurface open={props.open} onClose={requestClose}>
            <SideSheet onDismiss={requestClose}>
                <DrawerDismissBlockContext.Provider value={setDismissBlocked}>
                    {props.children}
                </DrawerDismissBlockContext.Provider>
            </SideSheet>
        </OverlaySurface>
    )
}
