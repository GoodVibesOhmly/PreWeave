import { promises } from "fs"
import Koa from "koa"
import { router } from "./routes/router"
async function runServer() {
    console.log("starting PreWeave")
    await promises.mkdir("./temp", { recursive: true })
    await promises.mkdir("./dataItems", { recursive: true })
    const app = new Koa()
    app.on("error", (err, _) => {
        console.log(err)
    })
    app.use(router.routes())
    // const server = 
    app.listen(1337);
    console.log("started server")

}
runServer()