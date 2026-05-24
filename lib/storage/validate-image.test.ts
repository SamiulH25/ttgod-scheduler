import { describe, expect, it } from "vitest";
import { assertImageFile } from "@/lib/storage/validate-image";

function fileWithBytes(bytes: number[], type: string): File {
  const buffer = new Uint8Array(bytes);
  const blob = new Blob([buffer], { type });
  return new File([blob], "test.img", { type });
}

describe("assertImageFile", () => {
  it("rejects wrong magic bytes", async () => {
    const file = fileWithBytes([0x00, 0x00, 0x00, 0x00], "image/png");
    await expect(assertImageFile(file)).rejects.toThrow(/does not match/);
  });

  it("accepts png magic", async () => {
    const file = fileWithBytes(
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      "image/png",
    );
    await expect(assertImageFile(file)).resolves.toBeUndefined();
  });
});
