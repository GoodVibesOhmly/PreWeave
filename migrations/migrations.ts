import { Knex } from "knex"
export async function up(knex: Knex) {
    const schema = await knex.schema
        .withSchema("public")
        .createTable("data_items", (tbl) => {
            tbl.string("data_item_id").primary().unique();
            tbl.boolean("exportable").defaultTo(false);
            tbl.bigInteger("data_start").notNullable();
        })
    return schema
}
export async function down(knex: Knex) {
    await knex.schema
        .withSchema("public")
        .dropTableIfExists("data_items")
}