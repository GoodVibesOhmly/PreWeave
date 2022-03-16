import { config } from "dotenv";
import knex, { Knex } from "knex";
import { Transaction } from "../types";

process.env = { ...process.env, ...config().parsed };

export const httpServerConnection = knex({
    client: "pg",
    pool: { min: 30, max: 50 },
    connection: {
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT || "5432"),
        database: process.env.DATABASE_NAME,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        multipleStatements: true,
        supportBigNumbers: true,
        bigNumberStrings: true
    },
});

export async function insertDataItem(connection: (Knex | Knex.Transaction), item: Transaction | Transaction[]): Promise<boolean> {
    try {
        await connection("data_items")
            .insert(item)
    } catch (e) {
        console.error(`Error occurred while inserting data item - ${e}`);
        console.debug(JSON.stringify(item))
        return false;
    }

    return true;
}

export async function exists(connection: (Knex), table: string, whereColumn: string, whereValue: string): Promise<boolean> {
    const res = await connection.first(
        connection.raw(
            "exists ? as present",
            connection(table).select(connection.raw("1")).where(whereColumn, "=", whereValue).limit(1)
        )
    );

    // Trust me
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return res.present;
}

export async function getDataItem(connection: Knex, id: string): Promise<Transaction> {
    return connection("data_items")
        .where("data_item_id", "=", id)
        .first()
}

export async function isExportable(connection: Knex, txId: string) {
    return (await getDataItem(connection, txId)).exportable ?? false
}

