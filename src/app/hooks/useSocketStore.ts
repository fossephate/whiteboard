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
} from "@tldraw/tldraw";
import { useEffect, useMemo, useState } from "react";
import { DEFAULT_STORE } from "./default_tldraw_store";
import { io } from 'socket.io-client';

const clientId = uniqueId();

export function useSocketIOStore({
  hostUrl,
  roomId = "example",
  shapeUtils = [],
}: {
  hostUrl: string;
  roomId?: string;
  shapeUtils?: TLAnyShapeUtilConstructor[];
}) {
  const [store] = useState(() => {
    const store = createTLStore({
      shapeUtils: [...defaultShapeUtils, ...shapeUtils],
    });
    store.loadSnapshot(DEFAULT_STORE);
    return store;
  });

  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({
    status: "loading",
  });

  // const { socket } = useMemo(() => {
  //   // const socket = io(hostUrl, { path: "/8201/socket.io" });
  //   // const socket = io('https://fosse.co', { path: "/8201/socket.io" });
  //   const socket = io('http://192.168.0.116:8201');

  //   socket.emit('join-room', roomId);
  //   return { socket };
  // }, [hostUrl]);

  // useEffect(() => {
  //   setStoreWithStatus({ status: "loading" });

  //   const unsubs: (() => void)[] = [];

  //   function handleSync() {
  //     // Connect store to socket.io events and vice versa

  //     /* -------------------- Document -------------------- */

  //     // Sync store changes to the server
  //     unsubs.push(
  //       store.listen(
  //         function syncStoreChangesToServer({ changes }) {
  //           socket.emit("store-changes", changes);
  //         },
  //         { source: "user", scope: "document" } // only sync user's document changes
  //       )
  //     );

  //     // Sync the server changes to the store
  //     socket.on("store-changes", (changes: any) => {
  //       const toRemove: TLRecord["id"][] = [];
  //       const toPut: TLRecord[] = [];

  //       Object.values(changes.added).forEach((record) => {
  //         toPut.push(record);
  //       });

  //       Object.values(changes.updated).forEach(([_, record]) => {
  //         toPut.push(record);
  //       });

  //       Object.values(changes.removed).forEach((record) => {
  //         toRemove.push(record.id);
  //       });

  //       // put / remove the records in the store
  //       store.mergeRemoteChanges(() => {
  //         if (toRemove.length) store.remove(toRemove);
  //         if (toPut.length) store.put(toPut);
  //       });
  //     });

  //     /* -------------------- Awareness ------------------- */

  //     const clientId = socket.id;
  //     setUserPreferences({ id: clientId });

  //     const userPreferences = computed<{
  //       id: string;
  //       color: string;
  //       name: string;
  //     }>("userPreferences", () => {
  //       const user = getUserPreferences();
  //       return {
  //         id: user.id,
  //         color: user.color ?? defaultUserPreferences.color,
  //         name: user.name ?? defaultUserPreferences.name,
  //       };
  //     });

  //     // Create the instance presence derivation
  //     const presenceId = InstancePresenceRecordType.createId(clientId);
  //     const presenceDerivation =
  //       createPresenceStateDerivation(userPreferences, presenceId)(store);

  //     // When the derivation changes, sync presence to the server
  //     unsubs.push(
  //       react("when presence changes", () => {
  //         const presence = presenceDerivation.value;
  //         socket.emit("presence-update", presence);
  //       })
  //     );

  //     // Sync server presence changes to the store
  //     socket.on("presence-update", (presence: TLInstancePresence) => {
  //       if (presence.id !== presenceId) {
  //         store.mergeRemoteChanges(() => {
  //           store.put([presence]);
  //         });
  //       }
  //     });

  //     socket.on("presence-remove", (clientId: string) => {
  //       const presenceId = InstancePresenceRecordType.createId(clientId);
  //       store.mergeRemoteChanges(() => {
  //         store.remove([presenceId]);
  //       });
  //     });

  //     // Initialize the store with the server records
  //     socket.emit("get-initial-records");
  //     socket.on("initial-records", (records: TLRecord[]) => {
  //       transact(() => {
  //         store.clear();
  //         store.put(records);
  //       });
  //       setStoreWithStatus({
  //         store,
  //         status: "synced-remote",
  //         connectionStatus: "online",
  //       });
  //     });
  //   }

  //   function handleDisconnect() {
  //     setStoreWithStatus({
  //       store,
  //       status: "synced-remote",
  //       connectionStatus: "offline",
  //     });
  //   }

  //   function handleConnect() {
  //     socket.emit("join-room", roomId);
  //     socket.on("synced", handleSync);
  //     unsubs.push(() => socket.off("synced", handleSync));
  //   }

  //   socket.on("connect", handleConnect);
  //   socket.on("disconnect", handleDisconnect);

  //   return () => {
  //     unsubs.forEach((fn) => fn());
  //     unsubs.length = 0;
  //     socket.off("connect", handleConnect);
  //     socket.off("disconnect", handleDisconnect);
  //   };
  // }, [socket, store]);











  useEffect(() => {
    const socket = io(hostUrl);
    socket.emit('join-room', roomId);

    setStoreWithStatus({ status: 'loading' })

    const unsubs: (() => void)[] = []

    const handleConnect = () => {
      console.log("asdadadadada");
      socket.emit('join-room', roomId);

      setStoreWithStatus({
        status: 'synced-remote',
        connectionStatus: 'online',
        store,
      });
      
      unsubs.push(() => socket.off('updates', handleUpdates));
    }

    const handleDisconnect = () => {
      // socket.off('updates', handleUpdates);

      setStoreWithStatus({
        status: 'synced-remote',
        connectionStatus: 'offline',
        store,
      });

      // socket.on('connect', handleConnect);
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
              socket.send(JSON.stringify({ clientId, type: 'recovery' }))
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
      socket.emit("updates",
        JSON.stringify({
          clientId,
          type: 'update',
          updates: pendingChanges,
        }),
      )
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

    return () => {
      unsubs.forEach((fn) => fn())
      unsubs.length = 0
      socket.close()
    }
  }, [store])

  return storeWithStatus;
}


















export function useYjsStore({
  hostUrl,
  version = 1,
  roomId = "example",
  shapeUtils = [],
}: {
  hostUrl: string;
  version?: number;
  roomId?: string;
  shapeUtils?: TLAnyShapeUtilConstructor[];
}) {
  const [store] = useState(() => {
    const store = createTLStore({
      shapeUtils: [...defaultShapeUtils, ...shapeUtils],
    });
    store.loadSnapshot(DEFAULT_STORE);
    return store;
  });

  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({
    status: "loading",
  });

  const { yDoc, yStore, room } = useMemo(() => {
    const yDoc = new Y.Doc({ gc: true });
    const yArr = yDoc.getArray<{ key: string; val: TLRecord }>(`tl_${roomId}`);
    const yStore = new YKeyValue(yArr);

    return {
      yDoc,
      yStore,
      room: new YPartyKitProvider(hostUrl, `${roomId}_${version}`, yDoc, {
        connect: true,
      }),
    };
  }, [hostUrl, roomId, version]);

  useEffect(() => {
    setStoreWithStatus({ status: "loading" });

    const unsubs: (() => void)[] = [];

    function handleSync() {
      // 1.
      // Connect store to yjs store and vis versa, for both the document and awareness

      /* -------------------- Document -------------------- */

      // Sync store changes to the yjs doc
      unsubs.push(
        store.listen(
          function syncStoreChangesToYjsDoc({ changes }) {
            yDoc.transact(() => {
              Object.values(changes.added).forEach((record) => {
                yStore.set(record.id, record);
              });

              Object.values(changes.updated).forEach(([_, record]) => {
                yStore.set(record.id, record);
              });

              Object.values(changes.removed).forEach((record) => {
                yStore.delete(record.id);
              });
            });
          },
          { source: "user", scope: "document" } // only sync user's document changes
        )
      );

      // Sync the yjs doc changes to the store
      const handleChange = (
        changes: Map<
          string,
          | { action: "delete"; oldValue: TLRecord }
          | { action: "update"; oldValue: TLRecord; newValue: TLRecord }
          | { action: "add"; newValue: TLRecord }
        >,
        transaction: Y.Transaction
      ) => {
        if (transaction.local) return;

        const toRemove: TLRecord["id"][] = [];
        const toPut: TLRecord[] = [];

        changes.forEach((change, id) => {
          switch (change.action) {
            case "add":
            case "update": {
              const record = yStore.get(id)!;
              toPut.push(record);
              break;
            }
            case "delete": {
              toRemove.push(id as TLRecord["id"]);
              break;
            }
          }
        });

        // put / remove the records in the store
        store.mergeRemoteChanges(() => {
          if (toRemove.length) store.remove(toRemove);
          if (toPut.length) store.put(toPut);
        });
      };

      yStore.on("change", handleChange);
      unsubs.push(() => yStore.off("change", handleChange));

      /* -------------------- Awareness ------------------- */

      const yClientId = room.awareness.clientID.toString();
      setUserPreferences({ id: yClientId })

      const userPreferences = computed<{
        id: string;
        color: string;
        name: string;
      }>("userPreferences", () => {
        const user = getUserPreferences();
        return {
          id: user.id,
          color: user.color ?? defaultUserPreferences.color,
          name: user.name ?? defaultUserPreferences.name,
        };
      });

      // Create the instance presence derivation
      const presenceId = InstancePresenceRecordType.createId(yClientId);
      const presenceDerivation =
        createPresenceStateDerivation(userPreferences, presenceId)(store);

      // Set our initial presence from the derivation's current value
      room.awareness.setLocalStateField("presence", presenceDerivation.value);

      // When the derivation change, sync presence to to yjs awareness
      unsubs.push(
        react("when presence changes", () => {
          const presence = presenceDerivation.value;
          requestAnimationFrame(() => {
            room.awareness.setLocalStateField("presence", presence);
          });
        })
      );

      // Sync yjs awareness changes to the store
      const handleUpdate = (update: {
        added: number[];
        updated: number[];
        removed: number[];
      }) => {
        const states = room.awareness.getStates() as Map<
          number,
          { presence: TLInstancePresence }
        >;

        const toRemove: TLInstancePresence["id"][] = [];
        const toPut: TLInstancePresence[] = [];

        // Connect records to put / remove
        for (const clientId of update.added) {
          const state = states.get(clientId);
          if (state?.presence && state.presence.id !== presenceId) {
            toPut.push(state.presence);
          }
        }

        for (const clientId of update.updated) {
          const state = states.get(clientId);
          if (state?.presence && state.presence.id !== presenceId) {
            toPut.push(state.presence);
          }
        }

        for (const clientId of update.removed) {
          toRemove.push(
            InstancePresenceRecordType.createId(clientId.toString())
          );
        }

        // put / remove the records in the store
        store.mergeRemoteChanges(() => {
          if (toRemove.length) store.remove(toRemove);
          if (toPut.length) store.put(toPut);
        });
      };

      room.awareness.on("update", handleUpdate);
      unsubs.push(() => room.awareness.off("update", handleUpdate));

      // 2.
      // Initialize the store with the yjs doc records—or, if the yjs doc
      // is empty, initialize the yjs doc with the default store records.
      if (yStore.yarray.length) {
        // Replace the store records with the yjs doc records
        transact(() => {
          // The records here should be compatible with what's in the store
          store.clear();
          const records = yStore.yarray.toJSON().map(({ val }) => val);
          store.put(records);
        });
      }
      // removed because this behavior sucks:
      // } else {
      //   // Create the initial store records
      //   // Sync the store records to the yjs doc
      //   yDoc.transact(() => {
      //     for (const record of store.allRecords()) {
      //       yStore.set(record.id, record);
      //     }
      //   });
      // }

      setStoreWithStatus({
        store,
        status: "synced-remote",
        connectionStatus: "online",
      });
    }

    let hasConnectedBefore = false;

    function handleStatusChange({
      status,
    }: {
      status: "disconnected" | "connected";
    }) {
      // If we're disconnected, set the store status to 'synced-remote' and the connection status to 'offline'
      if (status === "disconnected") {
        setStoreWithStatus({
          store,
          status: "synced-remote",
          connectionStatus: "offline",
        });
        return;
      }

      room.off("synced", handleSync);

      if (status === "connected") {
        if (hasConnectedBefore) return;
        hasConnectedBefore = true;
        room.on("synced", handleSync);
        unsubs.push(() => room.off("synced", handleSync));
      }
    }

    room.on("status", handleStatusChange);
    unsubs.push(() => room.off("status", handleStatusChange));

    return () => {
      unsubs.forEach((fn) => fn());
      unsubs.length = 0;
    };
  }, [room, yDoc, store, yStore]);

  return storeWithStatus;
}