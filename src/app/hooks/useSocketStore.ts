// From
// https://github.com/tldraw/tldraw-yjs-example/blob/main/src/useYjsStore.ts

import {
  InstancePresenceRecordType,
  TLAnyShapeUtilConstructor,
  TLInstancePresence,
  TLRecord,
  TLStoreWithStatus,
  computed,
  createPresenceStateDerivation,
  createTLStore,
  defaultShapeUtils,
  defaultUserPreferences,
  getUserPreferences,
  setUserPreferences,
  react,
  transact,
  throttle,
  HistoryEntry,
  StoreListener,
  uniqueId,
  loadSnapshot,
  getSnapshot,
  useEditor,
} from "@tldraw/tldraw";
import { useEffect, useMemo, useState } from "react";
import { DEFAULT_STORE } from "./default_tldraw_store";
import { io } from 'socket.io-client';

const clientId = uniqueId();

export function useSocketIOStore({
  hostUrl,
  hostPath,
  roomId = "default",
  shapeUtils = [],
}: {
  hostUrl: string;
  hostPath?: string;
  roomId?: string;
  shapeUtils?: TLAnyShapeUtilConstructor[];
}) {
  const [store] = useState(() => {
    const store = createTLStore({
      shapeUtils: [...defaultShapeUtils, ...shapeUtils],
    });
    // loadSnapshot(store, DEFAULT_STORE);
    return store;
  });

  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({
    status: "loading",
  });

  useEffect(() => {
    setStoreWithStatus({ status: 'loading' })
    const socket = io(hostUrl, { path: hostPath });
    const unsubs: (() => void)[] = [];
    let gotState = false;

    const handleConnect = () => {
      socket.emit("join-room", roomId);
      socket.emit("get-state");
      setStoreWithStatus({
        status: 'synced-remote',
        connectionStatus: 'online',
        store,
      });
    }

    const handleDisconnect = () => {
      setStoreWithStatus({
        status: 'synced-remote',
        connectionStatus: 'offline',
        store,
      });
    }

    const handleUpdates = (message: any) => {
      const data = JSON.parse(message);
      try {
        if (data.clientId === clientId) {
          return
        }

        switch (data.type) {
          case 'init': {
            store.loadSnapshot(data.snapshot)
            break
          }
          case 'recovery': {
            store.loadSnapshot(data.snapshot)
            break
          }
          case 'update': {
            try {
              for (const update of data.updates) {
                store.mergeRemoteChanges(() => {
                  const {
                    changes: { added, updated, removed },
                  } = update as HistoryEntry<TLRecord>

                  for (const record of Object.values(added)) {
                    store.put([record])
                  }
                  for (const [, to] of Object.values(updated)) {
                    store.put([to])
                  }
                  for (const record of Object.values(removed)) {
                    store.remove([record.id])
                  }
                })
              }
            } catch (e) {
              console.error(e)
              socket.emit("updates", JSON.stringify({ clientId, type: 'recovery' }))
            }
            break
          }
        }
      } catch (e) {
        console.error(e)
      }
    }

    const pendingChanges: HistoryEntry<TLRecord>[] = []

    const sendChanges = throttle(() => {
      if (pendingChanges.length === 0) return
      if (gotState) {
        socket.emit("updates",
          JSON.stringify({
            clientId,
            type: 'update',
            updates: pendingChanges,
          })
        );
        socket.emit("set-state", getSnapshot(store).document);
      }
      pendingChanges.length = 0
    }, 32);

    const handleChange: StoreListener<TLRecord> = (event) => {
      if (event.source !== 'user') return
      pendingChanges.push(event)
      sendChanges();
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("updates", handleUpdates);
    socket.on("must-join-a-room", () => {
      socket.emit("join-room", roomId);
      socket.emit("get-state");
    });


    socket.on("state-from-server", async (document) => {
      loadSnapshot(store, { document });
      gotState = true;
    });

    // ping:
    let pingCount = 0;
    let pingTimer = setInterval(() => {
      if (pingCount === undefined) {
        pingCount = 0;
      }
      pingCount += 1;
      if (pingCount > 20) {
        location.reload();
      }
    }, 1000);
    unsubs.push(() => clearInterval(pingTimer));
    socket.on("ping", () => {
      pingCount = 0;
    });

    unsubs.push(
      store.listen(handleChange, {
        source: 'user',
        scope: 'document',
      }),
    )

    // unsubs.push(
    // 	store.listen(handleChange, {
    // 		source: 'user',
    // 		scope: 'presence',
    // 	})
    // )

    unsubs.push(() => socket.off('connect', handleConnect))
    unsubs.push(() => socket.off('disconnect', handleDisconnect))
    unsubs.push(() => socket.off("updates", handleUpdates));
    unsubs.push(() => socket.off("ping"));

    return () => {
      unsubs.forEach((fn) => fn());
      unsubs.length = 0;
      socket.disconnect();
    }
  }, [store])

  return storeWithStatus;
}











