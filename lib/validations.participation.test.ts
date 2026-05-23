import { describe, expect, it } from "vitest";
import { participationPatchSchema } from "./validations";

describe("participationPatchSchema", () => {
  it("accepts body with status field", () => {
    const result = participationPatchSchema.parse({ status: "interested" });
    expect(result.status).toBe("interested");
  });

  it("rejects bare string (old client mistake)", () => {
    expect(() => participationPatchSchema.parse("interested")).toThrow();
  });
});
