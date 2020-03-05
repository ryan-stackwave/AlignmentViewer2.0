/**
 *
 * Sequence logo component.
 * Inspired / derived from https://github.com/weng-lab/logojs-package
 *  (but much simpler)
 */

import React from "react";
import Alignment from "./Alignment";
import { GlyphFactory } from "./SequenceLogoGlyphs";
import { acePrefix } from "./MolecularStyles";

export enum LOGO_TYPES {
  LETTERS = "letter stack",
  BARS = "bar plot"
}

interface IGlyphFrequency {
  frequency: number;
  letter: {
    letter: string;
    classNames: string;
  };
}
interface IGlyphStack extends Array<IGlyphFrequency> {}

export interface ISequenceLogoComponentProps {
  alignment: Alignment;
  glyphWidth: number;
  logoType: LOGO_TYPES;

  logoLoaded(node: HTMLDivElement): void;

  readonly id: string;
}

export class SequenceLogoComponent extends React.Component<
  ISequenceLogoComponentProps
> {
  private scrollerDiv?: HTMLDivElement | null;
  private loaded: boolean = false;

  divLoaded(e: HTMLDivElement | null) {
    if (e && !this.scrollerDiv) {
      //only run if first time element available
      this.scrollerDiv = e;
      this.props.logoLoaded(this.scrollerDiv);
    }
  }

  shouldComponentUpdate(nextProps: ISequenceLogoComponentProps) {
    if (
      this.loaded === false ||
      this.props.logoType !== nextProps.logoType ||
      this.props.glyphWidth !== nextProps.glyphWidth
    ) {
      return true;
    }
    return false;
  }

  render() {
    if (!this.props.alignment || !this.props.glyphWidth) {
      return null;
    }

    const positionalLetterCounts = this.props.alignment.getPositionalLetterCounts();
    const lettersSorted = this.props.alignment.getSortedAlphaLetters();

    //calculate the frequencies of all letters in each column
    const frequencies: number[][] = [];
    positionalLetterCounts.forEach((letterCounts, position) => {
      const totalCountAtPosition = Object.keys(letterCounts).reduce(
        (total, letter) => {
          total += letterCounts[letter];
          return total;
        },
        0
      );

      const frequenciesAtPosition: number[] = lettersSorted.map(letter => {
        let freq = 0;
        if (letter in letterCounts) {
          freq = letterCounts[letter] / totalCountAtPosition;
        }
        return freq;
      });

      frequencies.push(frequenciesAtPosition);
    });

    //load alphabet information
    const sortedAlphabet = lettersSorted.map(letter => {
      return {
        letter: letter,
        classNames: acePrefix + letter
      };
    });

    //munge in alphabet and sort by frequency
    const logoData = frequencies.map((frequenciesAtPosition, positionIdx) => {
      return frequenciesAtPosition
        .map((frequency, letterIdx) => {
          return {
            frequency: frequency,
            letter: sortedAlphabet[letterIdx]
          };
        })
        .filter(freq => {
          return freq.frequency !== 0;
        })
        .sort((a, b) => (a.frequency > b.frequency ? 1 : -1));
    });

    const totalWidth = frequencies.length * this.props.glyphWidth;
    const totalHeight = 100;
    this.loaded = true;

    /**
     * Generate the svg elements for a single position, i.e., column
     *
     */
    const generateStack = (positionalFrequencies: IGlyphStack) => {
      let dy = 100;

      const xscale = 2 / logoData.length; // not exact, but works.
      return positionalFrequencies.map((freq, idx) => {
        dy = dy - freq.frequency * 100;

        if (this.props.logoType === LOGO_TYPES.BARS) {
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

        const selectedGlyph = GlyphFactory.glyphFromChar(freq.letter.letter)({
          className: freq.letter.classNames,
          transform: `translate(0, ${dy}) scale(${xscale},${freq.frequency})`,
          key: `idxglyph_${idx}`
        });
        return selectedGlyph;
      });
    };

    return (
      <div id={this.props.id} ref={e => this.divLoaded(e)}>
        <svg
          preserveAspectRatio="none"
          viewBox={`0 0 ${logoData.length} 100`}
          style={{ width: totalWidth, height: totalHeight }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {logoData.map((singlePositionData, positionIdx) => {
            return (
              <g
                transform={`translate(${positionIdx},0)`}
                key={"p_" + positionIdx}
              >
                {generateStack(singlePositionData)}
              </g>
            );
          })}
        </svg>
      </div>
    );
  }
}
