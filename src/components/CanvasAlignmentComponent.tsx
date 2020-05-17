import React from "react";
import { Alignment } from "../common/Alignment";
import { SequenceSorter } from "../common/AlignmentSorter";
import * as PIXI from "pixi.js";
import { Stage, AppContext } from "@inlet/react-pixi";
import {
  CanvasAlignmentViewport,
  ICanvasAlignmentViewportProps,
} from "./CanvasAlignmentViewportComponent";
import { CanvasAlignmentHighlighter } from "./CanvasAlignmentHighlighterComponent";
import { CanvasAlignmentTiled } from "./CanvasAlignmentTiledComponent";

import {
  IColorScheme,
  PositionsToStyle,
  AlignmentTypes,
} from "../common/MolecularStyles";

export interface ICanvasAlignmentProps {
  alignment: Alignment;
  alignmentType: AlignmentTypes;
  sortBy: SequenceSorter;
  positionsToStyle: PositionsToStyle;
  colorScheme: IColorScheme;
  highlightRows?: {
    rowStart: number;
    rowEnd: number;
  };
  stageDimensions?: {
    width: number;
    height: number;
  };
  viewportProps?: Partial<ICanvasAlignmentViewportProps>;

  onClick?(mousePosition: IPosition): void;
  onIndicatorDrag?(indicatorBounds: IRectangle, mousePosition: IPosition): void;
}

interface ICanvasAlignmentState {
  dragging: boolean;

  dragPositions?: {
    startOffset: {
      left: number;
      top: number;
    };
    current: PIXI.Point;
  };
}

export class CanvasAlignmentComponent extends React.Component<
  ICanvasAlignmentProps,
  ICanvasAlignmentState
> {
  app?: PIXI.Application;
  protected divElement: React.RefObject<HTMLInputElement>;

  static defaultProps = {
    stageDimensions: {
      width: 485,
      height: 650,
    },
  };

  constructor(props: ICanvasAlignmentProps) {
    super(props);
    this.state = {
      dragging: false,
    };
    this.divElement = React.createRef();
  }

  /**
   * Inform parent of the end of a drag event
   * @param newMousePosition
   */
  protected informParentOfIndicatorDragged(newMousePosition: PIXI.Point) {
    const { alignment, onIndicatorDrag } = this.props;
    const { dragPositions } = this.state;

    if (onIndicatorDrag && dragPositions) {
      onIndicatorDrag(
        {
          x: 0,
          y: Math.round(newMousePosition.y - dragPositions!.startOffset.top),
          width: alignment.getMaxSequenceLength(),
          height: 0,
        },
        newMousePosition
      );
    }
  }

  render() {
    if (!this.props.alignment) {
      return null;
    }

    const {
      alignment,
      alignmentType,
      colorScheme,
      highlightRows,
      onClick,
      positionsToStyle,
      sortBy,
      stageDimensions,
      viewportProps,
    } = this.props;
    const { dragging, dragPositions } = this.state;

    const numSequences = alignment.getSequences().length;
    const maxSeqLength = alignment.getMaxSequenceLength();

    PIXI.utils.skipHello();
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST; //
    //TODO: still anti-aliases on retina devices. probably requires
    //      writing 4x the pixels and telling pixi that it is a retina
    //      image
    //PIXI.settings.RESOLUTION = 2;
    //PIXI.settings.ROUND_PIXELS = true; //

    let rowHighlightStart: number | undefined;
    let rowHighlighterHeight: number | undefined;

    if (highlightRows) {
      rowHighlighterHeight = highlightRows.rowEnd - highlightRows.rowStart + 1; //why +1? start/end inclusive
      rowHighlightStart =
        dragging && dragPositions
          ? Math.round(dragPositions.current.y - dragPositions.startOffset.top)
          : highlightRows.rowStart;
      rowHighlightStart = rowHighlightStart > 0 ? rowHighlightStart : 0;
    }

    //const stageHeight =
    //  this.divElement.current && this.divElement.current.clientHeight // can be zero. this is kind of hacky
    //    ? this.divElement.current.clientHeight
    //    : stageDimensions?.height;
    const stageHeight = stageDimensions?.height;
    const stageWidth = stageDimensions?.width;

    return (
      <div
        className="alignment-canvas"
        onWheel={this.onWheel}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
        //style={{ width: stageWidth }}
        ref={this.divElement}
      >
        {!this.divElement ? null : (
          <Stage
            width={stageWidth}
            height={stageHeight}
            options={{ transparent: true }}
          >
            <AppContext.Consumer>
              {(app) => {
                this.app = app;
                return <></>;
              }}
            </AppContext.Consumer>
            <AppContext.Consumer>
              {(app) => (
                <CanvasAlignmentViewport
                  app={app}
                  ensureVisible={
                    rowHighlightStart === undefined ||
                    rowHighlighterHeight === undefined
                      ? undefined
                      : {
                          y: rowHighlightStart,
                          height: rowHighlighterHeight,
                        }
                  }
                  numColumns={maxSeqLength}
                  numRows={numSequences}
                  onMouseClick={onClick}
                  stageDimensions={stageDimensions!}
                  {...viewportProps}
                >
                  <CanvasAlignmentTiled
                    alignment={alignment}
                    alignmentType={alignmentType}
                    sortBy={sortBy}
                    colorScheme={colorScheme}
                    positionsToStyle={positionsToStyle}
                  />
                  {rowHighlightStart !== undefined &&
                  rowHighlighterHeight !== undefined &&
                  rowHighlighterHeight < alignment.getSequences().length ? (
                    <CanvasAlignmentHighlighter
                      fillColor={0xff0000}
                      fillAlpha={0.25}
                      x={0}
                      y={rowHighlightStart}
                      width={maxSeqLength}
                      height={rowHighlighterHeight}
                      dragFunctions={{
                        onDragStart: (e, parent) => {
                          const startPosition = e.data.getLocalPosition(parent);
                          this.setState({
                            dragging: true,
                            dragPositions: {
                              startOffset: {
                                left: startPosition.x - 0,
                                top: startPosition.y - rowHighlightStart!,
                              },
                              current: startPosition,
                            },
                          });
                        },
                        onDragEnd: (e, parent) => {
                          this.setState({ dragging: false });
                          this.informParentOfIndicatorDragged(
                            e.data.getLocalPosition(parent)
                          );
                        },
                        onDragMove: (e, parent) => {
                          if (dragging) {
                            const newPosition = e.data.getLocalPosition(parent);

                            this.setState({
                              dragPositions: {
                                startOffset: dragPositions!.startOffset,
                                current: newPosition,
                              },
                            });
                            this.informParentOfIndicatorDragged(newPosition);
                          }
                        },
                      }}
                    />
                  ) : (
                    <></>
                  )}
                </CanvasAlignmentViewport>
              )}
            </AppContext.Consumer>
          </Stage>
        )}
      </div>
    );
  }

  protected onMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    //keep the scroll bars from appearing when the user is interacting with
    //the canvas. This fixes an issue where the canvas keeps moving around
    //due to appearince of the scroll bar in safari.
    document.body.style.overflow = "hidden";
  };

  protected onMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    document.body.style.overflow = "auto";
  };

  protected onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    //console.log("onWheel!", e);
    //e.preventDefault(); //TODO Drew is this necessary?
  };
}
