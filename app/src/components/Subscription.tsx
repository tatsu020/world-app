import { useClient } from '../contexts/Client'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, CCImage, Checkbox, Text, List, ListItem } from '@concrnt/ui'
import { CssVar } from '../types/Theme'
import { useSubscribe } from '../hooks/useSubscribe'
import { PinnedListItemClass } from '@concrnt/worldlib'
import { List as ListType } from '@concrnt/worldlib'
import { MdPlaylistAdd } from 'react-icons/md'
import { ListCreator } from './ListCreator'
import { useDrawerDismissBlock } from '../ui/Drawer'

export const Subscription = ({ target }: { target: string }) => {
    const { t } = useTranslation('', { keyPrefix: 'components.subscription' })
    const { t: tCommon } = useTranslation('', { keyPrefix: 'common' })
    const { client } = useClient()
    const [creatorOpen, setCreatorOpen] = useState(false)
    const [createdList, setCreatedList] = useState<ListType | null>(null)
    const [createdListURI, setCreatedListURI] = useState<string | null>(null)
    const [creatorComplete, setCreatorComplete] = useState(false)
    const [creatorBusy, setCreatorBusy] = useState(false)
    const [addStatus, setAddStatus] = useState<'idle' | 'adding' | 'failed' | 'added'>('idle')
    const addPendingRef = useRef(false)
    const setDrawerDismissBlocked = useDrawerDismissBlock()

    useEffect(() => {
        setDrawerDismissBlocked(creatorBusy || addStatus === 'adding')
        return () => setDrawerDismissBlocked(false)
    }, [addStatus, creatorBusy, setDrawerDismissBlocked])

    useEffect(() => {
        if (creatorComplete && addStatus === 'added') setCreatorOpen(false)
    }, [addStatus, creatorComplete])

    const addToCreatedList = async (uri: string) => {
        if (addPendingRef.current) return

        addPendingRef.current = true
        setAddStatus('adding')
        try {
            const list = await client.getList(uri)
            if (!list) throw new Error(`Created list not found: ${uri}`)

            setCreatedList(list)
            await list.addItem(client, target)
            setAddStatus('added')
        } catch (error) {
            console.error('Failed to add item to newly created list:', error)
            setAddStatus('failed')
        } finally {
            addPendingRef.current = false
        }
    }

    const openCreator = () => {
        setCreatedListURI(null)
        setCreatorComplete(false)
        setCreatorBusy(false)
        setAddStatus('idle')
        setCreatorOpen(true)
    }

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: CssVar.space(4),
                width: '100%'
            }}
        >
            {creatorOpen ? (
                <>
                    <div style={{ alignSelf: 'flex-start' }}>
                        <Button
                            variant="text"
                            disabled={creatorBusy || addStatus === 'adding'}
                            onClick={() => setCreatorOpen(false)}
                        >
                            {createdListURI ? t('backToLists') : tCommon('cancel')}
                        </Button>
                    </div>
                    <ListCreator
                        onBusyChange={setCreatorBusy}
                        onCreated={(uri) => {
                            setCreatedListURI(uri)
                            void addToCreatedList(uri)
                        }}
                        onComplete={() => setCreatorComplete(true)}
                    />
                    {addStatus === 'failed' && (
                        <div
                            role="alert"
                            aria-live="assertive"
                            style={{ display: 'flex', flexDirection: 'column', gap: CssVar.space(2) }}
                        >
                            <Text style={{ color: '#ff5b5b' }}>{t('addFailed')}</Text>
                            <Button
                                variant="outlined"
                                disabled={!createdListURI || creatorBusy}
                                onClick={async () => {
                                    if (createdListURI) await addToCreatedList(createdListURI)
                                }}
                            >
                                {tCommon('retry')}
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <Text variant="h3">{t('addToList')}</Text>
                    <Suspense fallback={<Text>Loading...</Text>}>
                        <Lists target={target} createdList={createdList} onCreate={openCreator} />
                    </Suspense>
                </>
            )}
        </div>
    )
}

const Lists = ({
    target,
    createdList,
    onCreate
}: {
    target: string
    createdList: ListType | null
    onCreate: () => void
}) => {
    const { t } = useTranslation('', { keyPrefix: 'components.subscription' })
    const { client } = useClient()
    const [pinnedLists] = useSubscribe(client.pinnedLists)

    return (
        <List>
            {pinnedLists.map((pin) => (
                <Pin key={pin.uri} pin={pin} target={target} />
            ))}
            {createdList && !pinnedLists.some((pin) => pin.uri === createdList.uri) && (
                <Item list={createdList} target={target} />
            )}
            <ListItem
                startIcon={<MdPlaylistAdd size={20} />}
                onClick={onCreate}
                style={{
                    padding: `${CssVar.space(2)} 0`,
                    borderBottom: `1px solid ${CssVar.divider}`
                }}
            >
                <Text>{t('createNewList')}</Text>
            </ListItem>
        </List>
    )
}

const Pin = ({ pin, target }: { pin: PinnedListItemClass; target: string }) => {
    const [list] = useSubscribe(pin.list)
    if (!list) return null

    return <Item list={list} target={target} />
}

const Item = ({ list, target }: { list: ListType; target: string }) => {
    const { client } = useClient()

    const [items] = useSubscribe(list.items)
    const contains = items.includes(target) ?? false

    return (
        <ListItem
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: CssVar.space(2),
                padding: `${CssVar.space(2)} 0`,
                borderBottom: `1px solid ${CssVar.divider}`
            }}
            secondaryAction={
                <Checkbox
                    checked={contains}
                    onChange={(checked) => {
                        if (!client) return
                        if (checked) {
                            // add
                            list.addItem(client, target)
                        } else {
                            // remove
                            list.removeItem(client, target)
                        }
                    }}
                />
            }
        >
            <span style={{ display: 'flex', alignItems: 'center', gap: CssVar.space(1) }}>
                {list.iconURL && (
                    <CCImage
                        src={list.iconURL}
                        maxHeight={128}
                        alt=""
                        style={{
                            height: '1.125rem',
                            flexShrink: 0
                        }}
                    />
                )}
                <Text>{list.title}</Text>
            </span>
        </ListItem>
    )
}
