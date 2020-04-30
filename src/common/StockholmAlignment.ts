import { Alignment, ISequence } from "./Alignment";

export interface IStockholmAlignmentMetadata {
  //GF: Data relating to the multiple sequence alignment as a whole, such as authors or
  //    number of sequences in the alignment. Duplicate feature names allowed (values added
  //    to string array)
  //
  //  e.g., #=GF DE CBS domain
  //        Where ``DE`` is the feature name and ``CBS Domain`` is the feature data
  //
  GF: { [featureName: string]: string }; //#=GF DE CBS domain - featureName="DE", data=["CBS domain"]

  //GS: Data relating to a specific sequence in the multiple sequence alignment. Duplicate
  //    sequence-feature pairs are allowed
  //
  //  e.g., #=GS O83071/259-312 AC O83071
  //        Where "O83071/259-312" is the sequence name, "AC" is the feature name, and
  //        "083071" is the feature data.
  GS: { [sequenceId: string]: { [featureName: string]: string[] } };

  // GR: Data relating to the columns of a specific sequence in a multiple sequence alignment.
  //     Duplicate sequence-features pairs are not allowed.
  //     Can also be thought of as positional metadata (i.e., like that sequences secondary
  //     structure positional annotation)
  //
  //  e.g., #=GR O31698/18-71 SS    CCCHHHHHHHHHHHHHHH..EEEEEEEE....EEEEEEEEHHH
  //        Where "031698/18-71" is the sequence name,  "SS" is the feature name, and
  //        "CCCHHHHHHHHHHHHHHH..EEEEEEEE....EEEEEEEEHHH" is the feature data.
  GR: { [sequenceId: string]: { [featureName: string]: string } };

  // GC: Data relating to the multiple sequence alignment as a whole.
  //     Duplicate sequence-features pairs are not allowed.
  //
  //  e.g., #=GC SS_cons            CCCCCHHHHHHHHHHHHH..EEEEEEEE....EEEEEEEEEEH
  //        Where "SS_cons" is the feature name and
  //        "CCCCCHHHHHHHHHHHHH..EEEEEEEE....EEEEEEEEEEH" is the feature data
  GC: { [key: string]: string }; //column info for entire alignment
}

/**
 * StockholmAlignment
 * This class represents a Stockholm formatted multiple sequence alignment.
 *
 * Parser inspired by:
 *   https://github.com/biocore/scikit-bio/blob/master/skbio/io/format/stockholm.py
 *
 * The class should be instantiated using the static methods:
 *     fromFileContents: accepts a stockholm file-like string
 */
export class StockholmAlignment extends Alignment {
  private metadata: IStockholmAlignmentMetadata;

  public constructor(
    name: string,
    sequencesAsInput: ISequence[],
    metadata: IStockholmAlignmentMetadata
  ) {
    super(name, sequencesAsInput);
    this.metadata = metadata;
  }

  /**
   * Parse a string that contains a stockholm alignment.
   * @param fileName
   * @param fileContents
   * @throws an Error if the fileContents don't contain the expected
   *         header and footer.
   */
  static fromFileContents(
    fileName: string,
    fileContents: string
  ): StockholmAlignment {
    const trimmedAndSplit = fileContents.trim().split(/\r?\n/);

    // Raise an error if the header and footer don't indicate
    // that the file string is of stockholm format:
    //   header must start with "# STOCKHOLM 1.0"
    //   footer must be "//"
    if (
      trimmedAndSplit.length < 3 ||
      trimmedAndSplit[0].startsWith("# STOCKHOLM 1.0") === false ||
      trimmedAndSplit[trimmedAndSplit.length - 1] !== "//"
    ) {
      throw Error(
        "'fileContents' do not appear to be stockholm format" +
          " (header !== '# STOCKHOLM 1.0' or footer !== '//')"
      );
    }

    const metadata: IStockholmAlignmentMetadata = {
      GF: {},
      GS: {},
      GR: {},
      GC: {},
    };
    const sequences: ISequence[] = [];
    trimmedAndSplit
      .slice(1, trimmedAndSplit.length - 1)
      .forEach((line, idx) => {
        line = line.trim();
        if (!line.startsWith("#")) {
          //sequence line
          const split = line.split(/(?<=^\S+)\s/);
          sequences.push({ id: split[0].trim(), sequence: split[1].trim() });
        } else {
          //metadata line
          if (
            line.length < 8 ||
            ["GF", "GS", "GR", "GC"].includes(line.substr(2, 2)) === false
          ) {
            console.warn(
              "Unexpected metadata line in Stockholm alignment: " + line
            );
          } else {
            const metadataGroup = line.substr(2, 2);
            const keyVal = line
              .substr(5)
              .trim()
              .split(/(?<=^\S+)\s/);
            keyVal[1] = keyVal[1].trim();

            if (metadataGroup === "GF") {
              if (keyVal[0] in metadata.GF === false) {
                metadata.GF[keyVal[0]] = keyVal[1];
              } else {
                metadata.GF[keyVal[0]] += " " + keyVal[1];
              }
            } else if (metadataGroup === "GS") {
              const seqId = keyVal[0];
              const featureVal = keyVal[1].trim().split(/(?<=^\S+)\s/);
              if (seqId in metadata.GS === false) {
                metadata.GS[seqId] = {};
              }
              if (featureVal[0] in metadata.GS[seqId] === false) {
                metadata.GS[seqId][featureVal[0]] = [];
              }
              metadata.GS[seqId][featureVal[0]].push(featureVal[1]);
            } else if (metadataGroup === "GR") {
              const seqId = keyVal[0];
              const featureVal = keyVal[1].trim().split(/(?<=^\S+)\s/);
              if (seqId in metadata.GR === false) {
                metadata.GR[seqId] = {};
              }
              metadata.GR[seqId][featureVal[0]] = featureVal[1];
            } else if (metadataGroup === "GC") {
              metadata.GC[keyVal[0]] = keyVal[1];
            }
          }
        }
      });
    console.log("metadata:", metadata);
    console.log("sequences:", sequences);
    return new StockholmAlignment(fileName, sequences, metadata);
  }

  getMetadata() {
    return this.metadata;
  }
}
