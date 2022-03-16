import Router from "@koa/router";
import { getExportable } from "./exportable";
import { getData } from "./getData";
import { getItem } from "./getItem";
import { downloadData, signData } from "./postData";
import { proxyToBundlr } from "./postDataItem";

export const router = new Router()
    // @ts-ignore 
    .post("/data", downloadData, signData)
    .post("/dataitem", proxyToBundlr)
    .get("/:txId", getData)
    .get("/item/:txid", getItem)
    .get("/exportable", getExportable)