import Alignment, { ISequence } from "../Alignment";

describe.only("Alignment", () => {
  //let pse1TargetSequence: ISequence;
  //let pse1Alignment: Alignment;

  it("Should allow sorting.", () => {
    const alignment = new Alignment("Test-Sequence", [
      { id: "id-1", sequence: "ZMA" }
    ]);
    expect(alignment.getSortedAlphaLetters()).toEqual(["A", "M", "Z"]);
  });

  it("Should allow getting normalized position counts.", () => {
    const alignment = new Alignment("Test-Sequence", [
      { id: "id-1", sequence: "ABC" },
      { id: "id-2", sequence: "CBA" }
    ]);
    const expected = new Map();
    expected.set(1, { A: 0.5, C: 0.5 });
    expected.set(2, { B: 1 });
    expected.set(3, { A: 0.5, C: 0.5 });
    expect(alignment.getPositionalLetterCounts(true)).toEqual(expected);
  });

  it("Should allow getting non-normalized position counts.", () => {
    const alignment = new Alignment("Test-Sequence", [
      { id: "id-1", sequence: "ABC" },
      { id: "id-2", sequence: "CBA" }
    ]);
    const expected = new Map();
    expected.set(1, { A: 1, C: 1 });
    expected.set(2, { B: 2 });
    expected.set(3, { A: 1, C: 1 });
    expect(alignment.getPositionalLetterCounts()).toEqual(expected);
  });

  it("Should return the first sequence in an alignment.", () => {
    const seq1 = { id: "id-1", sequence: "ABC" };
    const alignment = new Alignment("Test-Sequence", [
      seq1,
      { id: "id-2", sequence: "CBA" }
    ]);
    expect(alignment.getTargetSequence()).toEqual(seq1);
  });

  /*
  beforeAll(async () => {
    const result = await fetch(
      `../public/7fa1c5691376beab198788a726917d48_b0.4.a2m`
    );
    pse1Alignment = Alignment.fromFile(
      "7fa1c5691376beab198788a726917d48_b0.4.a2m",
      await result.text()
    );
    pse1TargetSequence = pse1Alignment.getSequences()[0];
    expect(pse1Alignment.getName()).toEqual(
      "7fa1c5691376beab198788a726917d48_b0.4.a2m"
    );
  });
  */
});