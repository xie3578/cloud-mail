import orm from '../entity/orm';
import { subscription } from '../entity/subscription';
import email from '../entity/email';
import { eq, and, count, desc } from 'drizzle-orm';
import { isDel } from '../const/entity-const';

const subscriptionService = {

	async list(c, userId) {
		const subs = await orm(c).select().from(subscription)
			.where(eq(subscription.userId, userId))
			.orderBy(desc(subscription.createTime))
			.all();

		if (!subs.length) return [];

		const emailCounts = await orm(c)
			.select({ sendEmail: email.sendEmail, total: count() })
			.from(email)
			.where(and(eq(email.userId, userId), eq(email.isDel, isDel.NORMAL)))
			.groupBy(email.sendEmail)
			.all();

		const countMap = {};
		emailCounts.forEach(row => { countMap[(row.sendEmail || '').toLowerCase()] = row.total; });

		return subs.map(s => ({
			...s,
			emailCount: countMap[(s.senderEmail || '').toLowerCase()] || 0,
		}));
	},

	async add(c, { senderEmail, name }, userId) {
		if (!senderEmail) throw new Error('发件人邮箱不能为空');
		const existing = await orm(c).select().from(subscription)
			.where(and(eq(subscription.userId, userId), eq(subscription.senderEmail, senderEmail))).get();
		if (existing) return existing;
		return orm(c).insert(subscription)
			.values({ userId, senderEmail, name: name || senderEmail })
			.returning().get();
	},

	async delete(c, { subscriptionId }, userId) {
		await orm(c).delete(subscription)
			.where(and(
				eq(subscription.subscriptionId, Number(subscriptionId)),
				eq(subscription.userId, userId)
			)).run();
	},

	async deleteByUserId(c, userId) {
		await orm(c).delete(subscription).where(eq(subscription.userId, userId)).run();
	}
};

export default subscriptionService;
