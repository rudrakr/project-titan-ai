import * as fs from "fs";
import path from "path";

export async function extractText(filePath: string): Promise<string> {

    const extension = path.extname(filePath).toLowerCase();

    switch (extension) {

        case ".txt":
            return fs.readFileSync(filePath, "utf-8");

        case ".pdf":
            throw new Error("PDF support coming next.");

        default:
            throw new Error(`Unsupported file type: ${extension}`);
    }
}