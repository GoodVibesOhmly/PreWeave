import { Knex } from "knex"
export async function up(knex: Knex) {
    return knex.schema
        .withSchema("public")
        .createTable("transactions", (tbl) => {
            tbl.string("tx_id").primary().unique();
            tbl.boolean("exportable").defaultTo(false);
            tbl.bigInteger("data_start").notNullable();
            tbl.timestamp("date_created").notNullable().defaultTo(knex.fn.now());
        });
}
export async function down(knex: Knex) {
    await knex.schema
        .withSchema("public")
        .dropTableIfExists("transactions")
}