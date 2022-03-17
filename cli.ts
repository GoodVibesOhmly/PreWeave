import { Command } from "commander";
import mirror from "./functions/mirror"
import upload from "./functions/export"
const program = new Command()

// program
//     .option("-h --host <string>", "host/local PreWeave node to communicate with")
// .option("-t --target <string>", "host to target")

program.command("mirror").description("mirrors another PreWeave node").argument("<target>", "target to mirror from")
    .action(async (target: string) => {
        console.log(`mirroring from ${target}`)
        await mirror(target)
    })


program.command("export").description("Uploads all exportable transactions to Bundlr")
    .action(async () => {
        console.log("Uploading to Bundlr")
        try {
            await upload();
        } catch (e) {
            console.error("lol");
        }
        process.exit(0);
    })

// const options = program.opts();
const argv = process.argv;
program.parse(argv);