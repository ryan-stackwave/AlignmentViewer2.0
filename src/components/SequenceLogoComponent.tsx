/**
 * Sequence logo component.
 * Inspired / derived from https://github.com/weng-lab/logojs-package
 *  (but simpler)
 */

import React from "react";
import "./SequenceLogo.scss";
import { Alignment } from "../common/Alignment";
import { GlyphFactory } from "../common/SequenceLogoGlyphs";
import {
  aceResidueParentClass,
  getLetterClassNames,
  AlignmentTypes,
  AminoAcidAlignmentStyle,
  NucleotideAlignmentStyle,
  PositionsToStyle,
} from "../common/MolecularStyles";
import ReactTooltip from "react-tooltip";
import { AminoAcid, Nucleotide } from "../common/Residues";
import { VirtualizedMatrixViewer } from "./virtualization/VirtualizedMatrixViewerHook";

export enum LOGO_TYPES {
  LETTERS = "Letter Stack",
  BARS = "Bar Plot",
}

interface ILetterWithClasses {
  letter: string;
  classNames: string;
}
interface IGlyphFrequency {
  count: number;
  frequency: number;
  letter: ILetterWithClasses;
  residue: AminoAcid | Nucleotide;
}
interface IGlyphStackData extends Array<IGlyphFrequency> {}

export interface ISequenceLogoProps {
  //don't expose these props in the AlignmentViewer full component
  id: string;
  alignment: Alignment;
  glyphWidth: number;
  style: AminoAcidAlignmentStyle | NucleotideAlignmentStyle;

  //scrollerLoaded: (e: HTMLElement) => void;
  //scrollerUnloaded: (e: HTMLElement) => void;

  //props that should be exposed in AlignmentViewer full component:
  logoType?: LOGO_TYPES;
  tooltipPlacement?: "top" | "right" | "bottom" | "left"; //default to undefined => automatic
  height?: number;
}

interface ISequenceLogoState {
  logoData?: IGlyphStackData;
}

export class SequenceLogoComponent extends React.Component<
  ISequenceLogoProps,
  ISequenceLogoState
> {
  private cache?: JSX.Element;
  private logoData?: IGlyphStackData[];
  static defaultProps = {
    logoType: LOGO_TYPES.LETTERS,
    height: 100,
  };

  constructor(props: ISequenceLogoProps) {
    super(props);
  }

  /*
   *
   *
   * PRIVATE METHODS
   *
   *
   */

  private renderTooltip() {
    const { tooltipPlacement } = this.props;

    return (
      <ReactTooltip
        id="getLogoTooltip"
        effect="solid"
        type="light"
        place={tooltipPlacement} //isn't always respected?
        border={true}
        getContent={(pos: string) => {
          if (!pos || !this.logoData || !this.logoData[parseInt(pos)]) {
            return;
          }

          const position = parseInt(pos) + 1;
          const glyphData = this.logoData[parseInt(pos)];
          return glyphData.length === 0 ? null : (
            <div className="logo-tooltip">
              <h1>Position: {position}</h1>
              <div className="row">
                <div className="col legend-square"></div>
                <div className="col header name">Residue</div>
                <div className="col header frequency">Frequency</div>
                <div className="col header count">Count</div>
              </div>
              {glyphData
                .slice()
                .reverse()
                .map((letterFreq, myidx) => {
                  return (
                    <div key={myidx} className="row">
                      <div
                        className={`col legend-square ${letterFreq.letter.classNames}`}
                      ></div>
                      <div className="col name">
                        {`${letterFreq.residue.fullName} [${letterFreq.letter.letter}]`}
                      </div>
                      <div className="col frequency">
                        {+(letterFreq.frequency * 100).toFixed(2)}%
                      </div>
                      <div className="col count">{letterFreq.count}</div>
                    </div>
                  );
                })}
            </div>
          );
        }}
      />
    );
  }

  private renderSvg() {
    //colsToShow: number[]) {
    const { alignment, glyphWidth, height } = this.props;
    if (!alignment || !glyphWidth) {
      return null;
    }

    //perform a bunch of data munging
    this.logoData = this.mungeLogoData();
    const totalWidth = this.logoData.length * glyphWidth;
    //const totalWidth = colsToShow.length * glyphWidth;

    this.cache = (
      <svg
        preserveAspectRatio="none"
        viewBox={`0 0 ${this.logoData.length} 100`}
        //viewBox={`0 0 ${colsToShow.length} 100`}
        style={{
          width: totalWidth,
          height: height ? height : SequenceLogoComponent.defaultProps.height,
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {this.logoData.map((singlePositionData, positionIdx) => {
          return (
            <g
              transform={`translate(${positionIdx},0)`}
              //transform={`translate(${positionIdx - colsToShow[0]},0)`}
              className={aceResidueParentClass} //required for default coloring
              key={"p_" + positionIdx}
            >
              {this.renderSinglePositionStack(
                singlePositionData,
                this.logoData!.length
              )}
              <rect
                className="interaction-placeholder"
                width="1"
                height="100"
                data-for="getLogoTooltip"
                data-tip={positionIdx}
                data-class={"sequence-logo-tooltip-container"}
              ></rect>
            </g>
          );
        })}
      </svg>
    );
    return this.cache;
  }

  /**
   * Generate the svg elements for a single position, i.e., column
   */
  private renderSinglePositionStack(
    positionalFrequencies: IGlyphStackData,
    numGlyphStacks: number
  ) {
    const { logoType } = this.props;
    let dy = 100;

    return positionalFrequencies.map((freq, idx) => {
      dy = dy - freq.frequency * 100;

      if (logoType === LOGO_TYPES.BARS) {
        const xscale = 2 / numGlyphStacks; // not exact, but works.
        return (
          <rect
            width="100"
            height="100"
            transform={`translate(0, ${dy}) scale(${xscale},${freq.frequency})`}
            className={freq.letter.classNames}
            key={`idxrect_${idx}`}
          ></rect>
        );
      }

      const xscale = 0.009; // invariant scaling
      const selectedGlyph = GlyphFactory.glyphFromChar(freq.letter.letter)({
        className: freq.letter.classNames,
        transform: `translate(0, ${dy}) scale(${xscale},${freq.frequency})`,
        key: `idxglyph_${idx}`,
      });
      return selectedGlyph;
    });
  }

  /**
   * Munge letter count data that was calculated during alignment creation
   * into a form appropriate for the glyph generation
   */
  private mungeLogoData(): IGlyphStackData[] {
    const { alignment, style } = this.props;

    const numberSequences = alignment.getSequenceCount();
    const lettersSorted = alignment.getAllUpperAlphaLettersInAlignmentSorted();

    const moleculeClass =
      style.alignmentType === AlignmentTypes.AMINOACID ? AminoAcid : Nucleotide;

    //load class names for each letter
    const letterObjects = lettersSorted.reduce((arr, letter) => {
      arr[letter] = {
        letter: letter,
        classNames: getLetterClassNames(letter, false, false, false),
      };
      return arr;
    }, {} as { [letter: string]: ILetterWithClasses });

    //note: removes invalid letters, but letterCount (value) isn't sorted
    const plc = alignment.getPositionalLetterCounts(false, lettersSorted);
    return Array.from(plc).map(
      ([pos, letterCounts]): IGlyphStackData => {
        return Object.entries(letterCounts)
          .map(([letter, count]) => {
            return {
              count: count,
              frequency: count / numberSequences,
              letter: letterObjects[letter],
              residue: moleculeClass.fromSingleLetterCode(letter),
            };
          })
          .filter((freq) => {
            // remove empty letters
            return freq.frequency !== 0;
          })
          .sort((a, b) => (a.frequency > b.frequency ? 1 : -1));
      }
    );
  }

  /*
   *
   *
   * REACT METHODS
   *
   *
   */
  shouldComponentUpdate(nextProps: ISequenceLogoProps) {
    const { alignment, style, logoType, glyphWidth } = this.props;
    if (
      !this.logoData ||
      logoType !== nextProps.logoType ||
      glyphWidth !== nextProps.glyphWidth ||
      alignment !== nextProps.alignment ||
      style !== nextProps.style
    ) {
      return true;
    }
    return false;
  }

  componentDidUpdate() {
    ReactTooltip.rebuild();
  }

  render() {
    const { alignment, glyphWidth, height, id, style } = this.props;
    const classNames = [
      "sequence-logo",
      style.alignmentType.className,
      style.colorScheme.className,
      PositionsToStyle.ALL.className,
    ];

    return (
      <VirtualizedMatrixViewer
        id={id}
        direction="x"
        columnCount={alignment.getSequenceLength()}
        columnWidth={glyphWidth}
        rowCount={1}
        rowHeight={height ? height : SequenceLogoComponent.defaultProps.height}
        autoOffset={true}
        getData={(rowIdxsToRender, colIdxsToRender) => {
          return (
            <div
              className={classNames.join(" ")}
              style={{
                width: alignment.getSequenceLength() * glyphWidth,
                left: colIdxsToRender[0] * -glyphWidth,
              }}
            >
              {this.cache ? this.cache : this.renderSvg()}
              {this.renderTooltip()}
            </div>
          );
        }}
      />
    );
  }
}
