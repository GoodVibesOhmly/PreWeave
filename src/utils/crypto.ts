import { promises, readFileSync, read as fsRead, createReadStream } from "fs";
import { ArweaveSigner } from "arbundles/src/signing";
import { deepHash, MIN_BINARY_SIZE } from "arbundles";
import { promisify } from "util";
import { indexToType } from "arbundles/src/signing";
import { tagsParser } from "arbundles/src/parser";
import { byteArrayToLong } from "./byteArray";
import { SIG_CONFIG } from "arbundles/src/constants";
import { stringToBuffer } from "arweave/node/lib/utils";


const read = promisify(fsRead);

const JWK = JSON.parse(readFileSync("wallet.json").toString());

export const ARSigner = new ArweaveSigner(JWK)


const FOUR_KB = 4 * 1024;
// // @ts-ignore
// const TEN_KB = 10 * 1024;
// // @ts-ignore
// const HUNDRED_KB = 100 * 1024;
const MB = 1024 * 1024;

export async function verifyItem(filename: string, size: number): Promise<{ owner: Uint8Array, signature: Uint8Array }> {
    if (size < MB) {
        console.info("Verifying mem item");

        const before = performance.now();
        const itemBinary = await promises.readFile(filename);
        const after = performance.now();
        console.debug(`\`readingMemItem\` took ${after - before}ms`)
        return verifyMemItem(itemBinary);
    }

    const handle = await promises.open(filename, "r");
    const buffer = await read(
        handle.fd,
        Buffer.allocUnsafe(FOUR_KB),
        0,
        FOUR_KB,
        0,
    ).then(r => r.buffer);
    await handle.close();

    const sigType = byteArrayToLong(buffer.subarray(0, 2));
    const Signer = indexToType[sigType];
    const { sigLength, pubLength } = SIG_CONFIG[sigType];
    const signature = buffer.subarray(2, 2 + sigLength);
    const owner = buffer.subarray(2 + sigLength, 2 + sigLength + pubLength);

    const targetStart = 2 + sigLength + pubLength;
    const target = (buffer[targetStart] === 1) ? buffer.subarray(targetStart + 1, targetStart + 33) : Buffer.allocUnsafe(0);
    const anchorStart = targetStart + ((buffer[targetStart] === 1) ? 33 : 1);
    const anchor = (buffer[anchorStart] === 1) ? buffer.subarray(anchorStart + 1, anchorStart + 33) : Buffer.allocUnsafe(0);
    const tagsStart = anchorStart + ((buffer[anchorStart] === 1) ? 33 : 1);

    const tagsLength = byteArrayToLong(buffer.subarray(tagsStart, tagsStart + 8));
    const tagsBytesLength = byteArrayToLong(buffer.subarray(tagsStart + 8, tagsStart + 16));
    const tagsBytes = buffer.subarray(tagsStart + 16, tagsStart + 16 + tagsBytesLength);

    if (tagsBytesLength > 2048) throw new Error("Tags too large");


    if (tagsLength > 0) {
        const tags: { name: string; value: string }[] = tagsParser.fromBuffer(tagsBytes);

        if (tags.length !== tagsLength) {
            throw new Error("Tags lengths don't match");
        }
    }

    const signatureData = await deepHash([
        stringToBuffer("dataitem"),
        stringToBuffer("1"),
        stringToBuffer(sigType.toString()),
        owner,
        target,
        anchor,
        tagsBytes,
        createReadStream(filename, {
            start: tagsStart + 16 + tagsBytesLength,
            highWaterMark: MB,
        }),
    ]);
    if (!(await Signer.verify(owner, signatureData, signature))) {
        throw new Error("Signature invalid");
    }

    return { owner, signature };
}


export async function verifyMemItem(buffer: Buffer): Promise<{ owner: Uint8Array, signature: Uint8Array }> {
    if (buffer.byteLength < MIN_BINARY_SIZE) {
        throw new Error("Binary isn't big enough");
    }
    const sigType = byteArrayToLong(buffer.subarray(0, 2));
    const Signer = indexToType[sigType];
    const { sigLength, pubLength } = SIG_CONFIG[sigType];
    const signature = buffer.subarray(2, 2 + sigLength);
    const owner = buffer.subarray(2 + sigLength, 2 + sigLength + pubLength);

    const targetStart = 2 + sigLength + pubLength;
    const target = (buffer[targetStart] === 1) ? buffer.subarray(targetStart + 1, targetStart + 33) : Buffer.allocUnsafe(0);
    const anchorStart = targetStart + ((buffer[targetStart] === 1) ? 33 : 1);
    const anchor = (buffer[anchorStart] === 1) ? buffer.subarray(anchorStart + 1, anchorStart + 33) : Buffer.allocUnsafe(0);
    const tagsStart = anchorStart + ((buffer[anchorStart] === 1) ? 33 : 1);

    const tagsLength = byteArrayToLong(buffer.subarray(tagsStart, tagsStart + 8));
    const tagsBytesLength = byteArrayToLong(buffer.subarray(tagsStart + 8, tagsStart + 16));
    const tagsBytes = buffer.subarray(tagsStart + 16, tagsStart + 16 + tagsBytesLength);

    if (tagsBytesLength > 2048) throw new Error("Tags too large");

    if (tagsLength > 0) {
        const tags: { name: string; value: string }[] = tagsParser.fromBuffer(tagsBytes);

        if (tags.length !== tagsLength) {
            throw new Error("Tags lengths don't match");
        }
    }

    const signatureData = await deepHash([
        stringToBuffer("dataitem"),
        stringToBuffer("1"),
        stringToBuffer(sigType.toString()),
        owner,
        target,
        anchor,
        tagsBytes,
        buffer.subarray(tagsStart + 16 + tagsBytesLength),
    ]);

    if (await Signer.verify(owner, signatureData, signature)) return { owner, signature };
    else throw new Error("Invalid signature");
}
