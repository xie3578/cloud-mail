import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const subscription = sqliteTable('subscription', {
	subscriptionId: integer('subscription_id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull(),
	senderEmail: text('sender_email').notNull(),
	name: text('name').default('').notNull(),
	createTime: text('create_time').default(sql`CURRENT_TIMESTAMP`).notNull(),
});
export default subscription;
