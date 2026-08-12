import * as fs from "fs";
import type { Chunk } from "../types.js";


export function createChunks(text:string , source:string):Chunk[] {

// const fileContent: string = fs.readFileSync(filePath, "utf-8");

// console.log("fileContent==", fileContent);
const fileContent = text;

const chunks =
  fileContent?.split("----------------------------------") ?? [];

// console.log(chunks);

const updatedChunk = chunks.map((item, i) => {
//   console.log("item", item);
  const eachItem: Chunk = {
    id: i,
    title: `${item.trim().split("\n")}`,
    content: `${item?.trim() ?? ""}`,
    source
  };
  return eachItem;
});

// console.log("updatedChunk===" , updatedChunk);
return updatedChunk;

}
