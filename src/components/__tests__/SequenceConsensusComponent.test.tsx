import "jest-webgl-canvas-mock";
import * as React from "react";

import { shallow } from "enzyme";
import { Alignment } from "../../common/Alignment";
import { AceConsensusSequenceComponent } from "../AceConsensusSequenceComponent";

describe("AceConsensusSequenceComponent", () => {
  it("Should render when given default props.", () => {
    const wrapper = shallow(
      <AceConsensusSequenceComponent
        fontSize={3}
        editorLoaded={jest.fn()}
        alignment={new Alignment("", [])}
        id={"test-sequence-logo-component"}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
