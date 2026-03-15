import { createTwoFilesPatch } from "diff";

export function generateDiff(
  filePath: string,
  original: string | null,
  proposed: string
): string {
  const oldContent = original ?? "";
  const oldLabel = original === null ? "/dev/null" : `a/${filePath}`;
  const newLabel = `b/${filePath}`;

  return createTwoFilesPatch(oldLabel, newLabel, oldContent, proposed, "", "", {
    context: 3,
  });
}
