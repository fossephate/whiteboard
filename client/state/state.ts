import * as React from 'react'
import type { Doc, DrawShape, DrawStyles, State } from 'types'
import {
  TLPinchEventHandler,
  TLPointerEventHandler,
  TLShapeUtilsMap,
  TLWheelEventHandler,
  Utils,
} from '@tldraw/core'
import { Vec } from '@tldraw/vec'
import { StateManager } from 'rko'
import { draw, DrawUtil } from './shapes'
import type { StateSelector } from 'zustand'
import { copyTextToClipboard, pointInPolygon } from './utils'
import { EASING_STRINGS } from './easings'
import { io } from 'socket.io-client';


const VecRound = (vec: any) => vec.map(Math.round);

export const shapeUtils: TLShapeUtilsMap<DrawShape> = {
  draw: new DrawUtil(),
}

export const initialDoc: Doc = {
  page: {
    id: 'page',
    shapes: {},
    bindings: {},
  },
  pageState: {
    id: 'page',
    selectedIds: [],
    camera: {
      point: [0, 0],
      zoom: 1,
    },
  },
}

export const defaultStyle: DrawStyles = {
  size: 4,
  strokeWidth: 0,
  thinning: 0.75,
  streamline: 0.2,
  smoothing: 0.5,
  easing: 'linear',
  taperStart: 0,
  taperEnd: 0,
  capStart: true,
  capEnd: true,
  easingStart: 'linear',
  easingEnd: 'linear',
  isFilled: true,
  fill: '#000000',
  stroke: '#000000',
}

export const initialState: State = {
  appState: {
    status: 'idle',
    tool: 'drawing',
    editingId: undefined,
    style: defaultStyle,
    isPanelOpen: true,
    isPenModeEnabled: false,
  },
  ...initialDoc,
}

export const context = React.createContext<AppState>({} as AppState)

export class AppState extends StateManager<State> {
  shapeUtils = shapeUtils

  log = false

  currentStroke = {
    startTime: 0,
  }


  socket: any = null;
  savedStyle: any = null;
  someoneElseDrawing: boolean = false;

  constructor(initialState: State) {
    super(initialState, 'fridge-board', 1, (p, n) => n);
  }

  setRoomCode = (roomCode: string) => {
    if (this.socket != null) {
      this.socket?.close();
    }

    const socket = io('https://fosse.co', { path: "/8201/socket.io" });
    socket.emit('join-room', roomCode);

    let zoom = 1;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) {
      zoom = 0.421875;
    }

    // clear whatever local state we had saved, the server is authoratative on boot:
    this.patchState({
      page: {
        shapes: [],
      },
      pageState: {
        camera: {
          point: [0, 0],
          zoom: zoom,
        },
      },
    })


    socket.emit('get-state');

    socket.on('state-from-server', (data) => {
      if (data == null) {
        data = [];
      }
      this.patchState({
        page: {
          shapes: [],
        },
      });
      this.patchState({
        page: {
          shapes: data,
        },
      });
    })


    socket.on('undo', (data) => {
      this.undo();
    });

    socket.on('redo', (data) => {
      this.redo();
    });

    socket.on('pointer-start', (data) => {
      this.someoneElseDrawing = true;
      const { tool, info, style, camera } = data;
      if (style == null) {
        return;
      }

      this.savedStyle = JSON.stringify(this.state.appState.style);
      this.patchStyle(JSON.parse(style));
      this.createDrawingShape(info.point, camera)
    })

    socket.on('pointer-move', (data) => {
      const { status, tool, info, camera } = data;
      if (status === 'drawing') {
        const nextShape = this.updateDrawingShape(data.info.point, info.pressure, camera)
        if (nextShape) {
          this.patchState({
            page: {
              shapes: {
                [nextShape.id]: nextShape,
              },
            },
          })
        }
      }
    })

    socket.on('pointer-end', async (data) => {
      this.someoneElseDrawing = false;
      this.completeDrawingShape()

      // reset to our style:
      this.patchStyle(JSON.parse(this.savedStyle));
    });

    socket.on('reset-doc', (data) => {
      const { shapes } = this.state.page;
      this.patchState({
        page: {
          shapes: {
            ...Object.fromEntries(
              Object.keys(shapes).map((key) => [key, undefined])
            ),
          },
        },
      });
    });


    // socket.on('patch-style', (data) => {
    //   const style = JSON.parse(data.style);
    //   this.patchState({
    //     appState: {
    //       style,
    //     },
    //   });
    // });

    // socket.on('patch-style-all-shapes', (data) => {
    //   const style = JSON.parse(data.style);
    //   const { shapes } = this.state.page;

    //   this.patchState({
    //     appState: {
    //       style,
    //     },
    //     page: {
    //       shapes: {
    //         ...Object.fromEntries(
    //           Object.keys(shapes).map((id) => [id, { style }])
    //         ),
    //       },
    //     },
    //   })
    // })

    this.socket = socket;
  }

  onReady = () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window['app'] = this;
  }

  cleanup = (state: State) => {
    for (const id in state.page.shapes) {
      if (!state.page.shapes[id]) {
        delete state.page.shapes[id]
      }
    }

    return state
  }

  onPointerDown: TLPointerEventHandler = (info, event) => {
    const { state } = this;
    if (this.someoneElseDrawing) {
      return;
    }
    if (state.appState.isPenModeEnabled) {
      if (["mouse", "touch"].indexOf(event.pointerType) > -1) {
        return;
      }
    }
    if (state.appState.tool === 'panning') {
      this.patchState({
        appState: {
          status: 'panning',
        },
      });
      return;
    }

    this.socket?.emit('pointer-start', {
      tool: state.appState.tool,
      info: info,
      style: JSON.stringify(state.appState.style),
      camera: state.pageState.camera,
    });

    this.createDrawingShape(info.point, state.pageState.camera)
  }

  onPointerMove: TLPointerEventHandler = (info, event) => {

    if (this.someoneElseDrawing) {
      return;
    }

    if (event.buttons > 1) {
      return;
    }

    const { status, tool } = this.state.appState
    const { camera } = this.state.pageState;

    if (tool === 'panning' && status === 'panning') {
      const delta = Vec.div(info.delta, camera.zoom);
      this.patchState({
        pageState: {
          camera: {
            point: Vec.add(camera.point, delta),
          },
        },
      });
      return;
    }

    this.socket?.emit('pointer-move', {
      status: status,
      tool: tool,
      info: info,
      camera: camera,
    });

    if (status === 'drawing') {
      const nextShape = this.updateDrawingShape(info.point, info.pressure, camera)
      if (nextShape) {
        this.patchState({
          page: {
            shapes: {
              [nextShape.id]: nextShape,
            },
          },
        })
      }
    }
  }

  onPointerUp: TLPointerEventHandler = () => {
    const { state } = this;
    if (this.someoneElseDrawing) {
      return;
    }

    if (state.appState.tool === 'panning') {
      this.patchState({
        appState: {
          status: 'idle',
        },
      });
      return;
    }

    this.socket?.emit('pointer-end', {
      tool: state.appState.tool,
      snapshot: this.snapshot,
      shapes: this.state.page.shapes,
    });

    this.completeDrawingShape();
    this.socket.emit('set-state', { shapes: this.state.page.shapes });
  }


  zoomOut = () => {
    let newZoom = this.state.pageState.camera.zoom * 0.75;
    this.patchState({
      pageState: {
        camera: {
          point: [0, 0],
          zoom: newZoom,
        },
      },
    })
  }

  zoomIn = () => {
    let newZoom = this.state.pageState.camera.zoom * (1 + 1 / 3);
    this.patchState({
      pageState: {
        camera: {
          point: [0, 0],
          zoom: newZoom,
        },
      },
    })
  }

  zoomTo1 = () => {
    this.patchState({
      pageState: {
        camera: {
          point: [0, 0],
          zoom: 1,
        },
      },
    })
  }

  togglePenMode = () => {
    this.patchState({
      appState: {
        isPenModeEnabled: !this.state.appState.isPenModeEnabled
      },
    })
  }

  pinchZoom = (point: number[], delta: number[], zoom: number): this => {
    return;
    const { camera } = this.state.pageState
    const nextPoint = Vec.sub(camera.point, Vec.div(delta, camera.zoom))
    const nextZoom = zoom
    const p0 = Vec.sub(Vec.div(point, camera.zoom), nextPoint)
    const p1 = Vec.sub(Vec.div(point, nextZoom), nextPoint)

    return this.patchState({
      pageState: {
        camera: {
          point: VecRound(Vec.add(nextPoint, Vec.sub(p1, p0))),
          zoom: nextZoom,
        },
      },
    })
  }

  onPinchEnd: TLPinchEventHandler = () => {
    return;
    this.patchState({
      appState: { status: 'idle' },
    })
  }

  onPinch: TLPinchEventHandler = (info, e) => {
    return;
    if (this.state.appState.status !== 'pinching') return
    this.pinchZoom(info.point, info.delta, info.delta[2])
    this.onPointerMove?.(info, e as unknown as React.PointerEvent)
  }

  onPan: TLWheelEventHandler = (info) => {
    return;
    const { state } = this
    if (state.appState.status === 'pinching') return this

    const { camera } = state.pageState
    const delta = Vec.div(info.delta, camera.zoom)
    const prev = camera.point
    const next = Vec.sub(prev, delta)

    if (Vec.isEqual(next, prev)) return this

    const point = VecRound(next)

    if (state.appState.editingId && state.appState.status === 'drawing') {
      const shape = state.page.shapes[state.appState.editingId]
      const nextShape = this.updateDrawingShape(info.point, info.pressure, state.pageState.camera)

      this.patchState({
        pageState: {
          camera: {
            point,
          },
        },
        page: {
          shapes: {
            [shape.id]: nextShape,
          },
        },
      })

      if (nextShape) {
        this.patchState({
          page: {
            shapes: {
              [nextShape.id]: nextShape,
            },
          },
        })
      }
    }

    return this.patchState({
      pageState: {
        camera: {
          point,
        },
      },
    })
  }

  /* --------------------- Methods -------------------- */

  togglePanelOpen = () => {
    const { state } = this
    this.patchState({
      appState: {
        isPanelOpen: !state.appState.isPanelOpen,
      },
    })
  }

  createDrawingShape = (point: number[], camera: any) => {
    const { state } = this

    const pt = Vec.sub(Vec.div(point, camera.zoom), camera.point)

    const shape = draw.create({
      id: Utils.uniqueId(),
      point: pt,
      style: state.appState.style,
      points: [[0, 0, 0.5, 0]],
      isDone: false,
    })

    this.currentStroke.startTime = Date.now()

    return this.patchState({
      appState: {
        status: 'drawing',
        editingId: shape.id,
      },
      page: {
        shapes: {
          [shape.id]: shape,
        },
      },
    })
  }

  updateDrawingShape = (point: number[], pressure: number, camera: any) => {
    const { state, currentStroke } = this
    if (state.appState.status !== 'drawing') return
    if (!state.appState.editingId) return

    const shape = state.page.shapes[state.appState.editingId]

    const newPoint = [
      ...Vec.sub(
        VecRound(Vec.sub(Vec.div(point, camera.zoom), camera.point)),
        shape.point
      ),
      pressure,
      Date.now() - currentStroke.startTime,
    ]

    let shapePoint = shape.point

    let shapePoints = [...shape.points, newPoint]

    // Does the new point create a negative offset?
    const offset = [Math.min(newPoint[0], 0), Math.min(newPoint[1], 0)]

    if (offset[0] < 0 || offset[1] < 0) {
      // If so, then we need to move the shape to cancel the offset
      shapePoint = [
        ...VecRound(Vec.add(shapePoint, offset)),
        shapePoint[2],
        shapePoint[3],
      ]

      // And we need to move the shape points to cancel the offset
      shapePoints = shapePoints.map((pt) =>
        VecRound(Vec.sub(pt, offset)).concat(pt[2], pt[3])
      )
    }

    return {
      id: shape.id,
      point: shapePoint,
      points: shapePoints,
    }
  }

  completeDrawingShape = () => {
    const { state } = this
    const { shapes } = state.page
    if (!state.appState.editingId) return this // Don't erase while drawing

    let shape = shapes[state.appState.editingId]

    shape.isDone = true

    shape = {
      ...shape,
    }

    // this.socket.emit('set-state', this.state.page.shapes);

    // return this.setState({
    //   before: {
    //     appState: {
    //       status: 'idle',
    //       editingId: undefined,
    //     },
    //     page: {
    //       shapes: {
    //         [shape.id]: undefined,
    //       },
    //     },
    //   },
    //   after: {
    //     appState: {
    //       status: 'idle',
    //       editingId: undefined,
    //     },
    //     page: {
    //       shapes: {
    //         [shape.id]: shape,
    //       },
    //     },
    //   },
    // })

    return this.patchState({
      appState: {
        status: 'idle',
        editingId: undefined,
      },
      page: {
        shapes: {
          [shape.id]: shape,
        },
      },
    });
  }

  centerShape = (id: string) => {
    const shape = this.state.page.shapes[id]
    const bounds = shapeUtils.draw.getBounds(this.state.page.shapes[id])
    this.patchState({
      pageState: {
        camera: {
          point: Vec.add(shape.point, [
            window.innerWidth / 2 - bounds.width / 2,
            window.innerHeight / 2 - bounds.height / 2,
          ]),
          zoom: 1,
        },
      },
    })
  }

  replayShape = (points: number[][]) => {
    this.eraseAll()

    const newShape = draw.create({
      id: Utils.uniqueId(),
      parentId: 'page',
      childIndex: 1,
      point: [0, 0],
      points: [],
      style: this.state.appState.style,
    })

    this.patchState({
      page: {
        shapes: {
          [newShape.id]: newShape,
        },
      },
    })

    this.centerShape(newShape.id)

    points
      .map((pt, i) => [...Vec.sub(pt, newShape.point), pt[2], pt[3] || i * 10])
      .forEach((pt, i) => {
        setTimeout(() => {
          this.patchState({
            page: {
              shapes: {
                [newShape.id]: {
                  points: points.slice(0, i),
                },
              },
            },
          })
        }, pt[3] * 20)
      })
  }

  addShape = (shape: Partial<DrawShape>) => {
    const newShape = draw.create({
      id: Utils.uniqueId(),
      parentId: 'page',
      childIndex: 1,
      point: [0, 0],
      points: [],
      style: this.state.appState.style,
      ...shape,
    })

    const bounds = Utils.getBoundsFromPoints(newShape.points)

    const topLeft = [bounds.minX, bounds.minY]

    newShape.points = newShape.points.map((pt, i) =>
      Vec.sub(pt, topLeft).concat(pt[2] || 0.5, pt[3] || i * 10)
    )

    this.patchState({
      page: {
        shapes: {
          [newShape.id]: newShape,
        },
      },
    })

    this.persist()

    return newShape
  }

  erase = (point: number[]) => {
    const { state } = this
    const camera = state.pageState.camera
    const pt = Vec.sub(Vec.div(point, camera.zoom), camera.point)
    const { getBounds } = shapeUtils.draw

    return this.patchState({
      page: {
        shapes: {
          ...Object.fromEntries(
            Object.entries(state.page.shapes).map(([id, shape]) => {
              const bounds = getBounds(shape)

              if (Vec.dist(pt, shape.point) < 10) {
                return [id, undefined]
              }

              if (Utils.pointInBounds(pt, bounds)) {
                const points = draw.strokeCache.get(shape)

                if (
                  (points &&
                    pointInPolygon(Vec.sub(pt, shape.point), points)) ||
                  Vec.dist(pt, shape.point) < 10
                ) {
                  return [id, undefined]
                }
              }

              return [id, shape]
            })
          ),
        },
      },
    })
  }

  eraseAll = () => { }

  startStyleUpdate = () => {
    return this.setSnapshot()
  }

  patchStyleForAllShapes = (style: Partial<DrawStyles>) => {
    const { shapes } = this.state.page

    this.socket.emit('patch-style-all-shapes', {
      style: JSON.stringify(style),
    });

    return this.patchState({
      appState: {
        style,
      },
      page: {
        shapes: {
          ...Object.fromEntries(
            Object.keys(shapes).map((id) => [id, { style }])
          ),
        },
      },
    })
  }

  patchStyle = (style: Partial<DrawStyles>) => {

    this.socket.emit('patch-style', {
      style: JSON.stringify(style),
    });

    return this.patchState({
      appState: {
        style,
      },
    })
  }

  finishStyleUpdate = () => { }

  setNextStyleForAllShapes = (style: Partial<DrawStyles>) => {
    return;
  }

  // resetStyle = (prop: keyof DrawStyles) => {
  //   const { shapes } = this.state.page
  //   const { state } = this

  //   const initialStyle = initialState.appState.style[prop]

  //   return this.setState({
  //     before: {
  //       appState: state.appState,
  //       page: {
  //         shapes: {
  //           ...Object.fromEntries(
  //             Object.entries(shapes).map(([id, shape]) => [
  //               id,
  //               {
  //                 style: { [prop]: shape.style[prop] },
  //               },
  //             ])
  //           ),
  //         },
  //       },
  //     },
  //     after: {
  //       appState: {
  //         style: { [prop]: initialStyle },
  //       },
  //       page: {
  //         shapes: {
  //           ...Object.fromEntries(
  //             Object.keys(shapes).map((id) => [id, { [prop]: initialStyle }])
  //           ),
  //         },
  //       },
  //     },
  //   })
  // }

  zoomToContent = (): this => {
    const shapes = Object.values(this.state.page.shapes)
    const pageState = this.state.pageState

    if (shapes.length === 0) {
      this.patchState({
        pageState: {
          camera: {
            zoom: 1,
            point: [0, 0],
          },
        },
      })
    }

    const bounds = Utils.getCommonBounds(
      Object.values(shapes).map(shapeUtils.draw.getBounds)
    )

    const { zoom } = pageState.camera
    const mx = (window.innerWidth - bounds.width * zoom) / 2 / zoom
    const my = (window.innerHeight - bounds.height * zoom) / 2 / zoom
    const point = VecRound(Vec.add([-bounds.minX, -bounds.minY], [mx, my]))

    return this.patchState({
      pageState: { camera: { point } },
    })
  }

  resetStyles = () => {
    const { shapes } = this.state.page;
    const { state } = this;

    const currentAppState = state.appState
    const initialAppState = initialState.appState

    return this.setState({
      before: {
        appState: currentAppState,
      },
      after: {
        appState: initialAppState,
      },
    });
  }

  copyStyles = () => {
    const { state } = this
    const { style } = state.appState
    copyTextToClipboard(`{
  size: ${style.size},
  smoothing: ${style.smoothing},
  thinning: ${style.thinning},
  streamline: ${style.streamline},
  easing: ${EASING_STRINGS[style.easing].toString()},
  start: {
    taper: ${style.taperStart},
    cap: ${style.capStart},
  },
  end: {
    taper: ${style.taperEnd},
    cap: ${style.capEnd},
  },
}`)
  }

  copySvg = () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

    const shapes = Object.values(this.state.page.shapes)

    const bounds = Utils.getCommonBounds(shapes.map(draw.getBounds))

    const padding = 40

    shapes.forEach((shape: any) => {
      const fillElm = document.getElementById('path_' + shape.id)

      if (!fillElm) return

      const fillClone = fillElm.cloneNode(false) as SVGPathElement

      const strokeElm = document.getElementById('path_stroke_' + shape.id)

      if (strokeElm) {
        // Create a new group
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')

        // Translate the group to the shape's point
        g.setAttribute(
          'transform',
          `translate(${shape.point[0]}, ${shape.point[1]})`
        )

        // Clone the stroke element
        const strokeClone = strokeElm.cloneNode(false) as SVGPathElement

        // Append both the stroke element and the fill element to the group
        g.appendChild(strokeClone)
        g.appendChild(fillClone)

        // Append the group to the SVG
        svg.appendChild(g)
      } else {
        // Translate the fill clone and append it to the SVG
        fillClone.setAttribute(
          'transform',
          `translate(${shape.point[0]}, ${shape.point[1]})`
        )

        svg.appendChild(fillClone)
      }
    })

    // Resize the element to the bounding box
    svg.setAttribute(
      'viewBox',
      [
        bounds.minX - padding,
        bounds.minY - padding,
        bounds.width + padding * 2,
        bounds.height + padding * 2,
      ].join(' ')
    )

    svg.setAttribute('width', String(bounds.width))

    svg.setAttribute('height', String(bounds.height))

    const s = new XMLSerializer()

    const svgString = s
      .serializeToString(svg)
      .replaceAll('&#10;      ', '')
      .replaceAll(/((\s|")[0-9]*\.[0-9]{2})([0-9]*)(\b|"|\))/g, '$1')

    copyTextToClipboard(svgString)

    return svgString
  }

  resetDoc = () => {
    const { shapes } = this.state.page

    this.socket.emit('reset-doc');

    return this.patchState({
      page: {
        shapes: {
          ...Object.fromEntries(
            Object.keys(shapes).map((key) => [key, undefined])
          ),
        },
      },
    })
  }

  // // called whenever undo/redo are pressed:
  // forceState = () => {
  //   console.log("forcing state!!!!!");
  //   this.socket.emit('force-state', {
  //     shapes: this.state.page.shapes,
  //   });
  // }

  // called whenever undo/redo are pressed:
  undo2 = () => {
    this.socket.emit('undo');
  }

  redo2 = () => {
    this.socket.emit('redo');
  }

  onPinchStart: TLPinchEventHandler = () => {
    if (this.state.appState.status !== 'idle') return

    this.patchState({
      appState: { status: 'pinching' },
    })
  }

  selectDrawingTool = () => {
    this.patchState({
      appState: {
        tool: 'drawing',
      },
    });
    if (this.savedStyle != null) {
      this.patchStyle(JSON.parse(this.savedStyle));
    } else {
      this.patchStyle(defaultStyle);
    }
  }

  selectErasingTool = () => {
    this.patchState({
      appState: {
        tool: 'erasing',
      },
    });
    this.savedStyle = JSON.stringify(this.state.appState.style);
    this.patchStyle({ size: 80, fill: "#F8F9FA" });
  }

  selectPanningTool = () => {
    this.patchState({
      appState: {
        tool: 'panning',
      },
    });
  }
}

export const app = new AppState(initialState);

export function useAppState(): State
export function useAppState<K>(selector: StateSelector<State, K>): K
export function useAppState<K>(selector?: StateSelector<State, K>) {
  if (selector) {
    return app.useStore(selector)
  }
  return app.useStore()
}
