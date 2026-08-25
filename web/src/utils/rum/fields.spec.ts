// Copyright 2026 OpenObserve Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { describe, it, expect } from "vitest";
import { padRumTraceId } from "./fields";

describe("padRumTraceId", () => {
  it("restores the leading zero the SDK drops", () => {
    // The pair from issue #13733: 31 chars on the RUM row, 32 in the traces stream.
    expect(padRumTraceId("19fea78dc677c518b8ef5882504cd6d")).toBe(
      "019fea78dc677c518b8ef5882504cd6d",
    );
  });

  it("restores however many zeros are missing", () => {
    const short = "19fea78dc677c5188"; // 17 chars — 15 zeros dropped
    expect(short).toHaveLength(17);
    expect(padRumTraceId(short)).toBe("00000000000000019fea78dc677c5188");
  });

  it("leaves a full-length id untouched", () => {
    const id = "019fea78dc677c518b8ef5882504cd6d";
    expect(padRumTraceId(id)).toBe(id);
  });

  it("leaves a whole 64-bit id untouched", () => {
    // `_rumdata` is shared with the mobile SDKs; widening a complete id would break a
    // join that currently works.
    const sixtyFourBit = "19fea78dc677c518";
    expect(sixtyFourBit).toHaveLength(16);
    expect(padRumTraceId(sixtyFourBit)).toBe(sixtyFourBit);
  });

  it("produces a value that matches the traces-stream id", () => {
    // The join that #13733 reports as always failing.
    const fromRumRow = "19fea78dc847e7aa197da70df750e87";
    const fromTracesStream = "019fea78dc847e7aa197da70df750e87";
    expect(padRumTraceId(fromRumRow)).toBe(fromTracesStream);
  });

  it("passes through a value that is not plain hex", () => {
    // Long enough to reach the padding branch, so this exercises the hex check itself.
    const notHex = "not-a-hex-id-at-all!";
    expect(notHex.length).toBeGreaterThan(16);
    expect(padRumTraceId(notHex)).toBe(notHex);
  });

  it("does not truncate an over-long value", () => {
    const tooLong = "0".repeat(40);
    expect(padRumTraceId(tooLong)).toBe(tooLong);
  });

  it("returns an empty string for a missing id", () => {
    expect(padRumTraceId(undefined)).toBe("");
    expect(padRumTraceId(null)).toBe("");
    expect(padRumTraceId("")).toBe("");
  });
});
