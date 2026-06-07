import orm from '../entity/orm';
import { folder } from '../entity/folder';
import email from '../entity/email';
import account from '../entity/account';
import { eq, and, count, asc } from 'drizzle-orm';
import BizError from '../error/biz-error';
import { isDel } from '../const/entity-const';

const folderService = {

	async list(c, userId) {
		const folders = await orm(c).select().from(folder)
			.where(eq(folder.userId, userId))
			.orderBy(asc(folder.sort), asc(folder.createTime))
			.all();

		const emailCounts = await orm(c)
			.select({ folderId: email.folderId, total: count() })
			.from(email)
			.where(and(eq(email.userId, userId), eq(email.isDel, isDel.NORMAL)))
			.groupBy(email.folderId)
			.all();

		const countMap = {};
		emailCounts.forEach(row => { countMap[row.folderId] = row.total; });

		return folders.map(f => ({ ...f, emailCount: countMap[f.folderId] || 0 }));
	},

	async add(c, { name, color }, userId) {
		if (!name || !name.trim()) throw new BizError('文件夹名称不能为空');
		const existing = await orm(c).select().from(folder)
			.where(and(eq(folder.userId, userId), eq(folder.name, name.trim()))).get();
		if (existing) throw new BizError('文件夹名称已存在');
		return orm(c).insert(folder).values({ userId, name: name.trim(), color: color || '#6366f1' }).returning().get();
	},

	async update(c, { folderId, name, color }, userId) {
		folderId = Number(folderId);
		const existing = await orm(c).select().from(folder)
			.where(and(eq(folder.folderId, folderId), eq(folder.userId, userId))).get();
		if (!existing) throw new BizError('文件夹不存在');
		const updates = {};
		if (name && name.trim()) updates.name = name.trim();
		if (color) updates.color = color;
		return orm(c).update(folder).set(updates).where(eq(folder.folderId, folderId)).returning().get();
	},

	async delete(c, { folderId, deleteEmails, targetFolderId }, userId) {
		folderId = Number(folderId);
		const existing = await orm(c).select().from(folder)
			.where(and(eq(folder.folderId, folderId), eq(folder.userId, userId))).get();
		if (!existing) throw new BizError('文件夹不存在');

		if (Number(deleteEmails) === 1) {
			await orm(c).update(email).set({ isDel: isDel.DELETE })
				.where(and(eq(email.folderId, folderId), eq(email.userId, userId))).run();
		} else {
			const target = Number(targetFolderId) || 0;
			await orm(c).update(email).set({ folderId: target })
				.where(and(eq(email.folderId, folderId), eq(email.userId, userId))).run();
		}

		await orm(c).delete(folder).where(eq(folder.folderId, folderId)).run();
	},

	async batchDelete(c, { folderIds, deleteEmails, targetFolderId }, userId) {
		const ids = (folderIds || '').split(',').map(Number).filter(Boolean);
		for (const folderId of ids) {
			await this.delete(c, { folderId, deleteEmails, targetFolderId }, userId);
		}
	},

	async stats(c, userId) {
		const accountCount = await orm(c).select({ total: count() }).from(account)
			.where(and(eq(account.userId, userId), eq(account.isDel, isDel.NORMAL))).get();

		const folderCount = await orm(c).select({ total: count() }).from(folder)
			.where(eq(folder.userId, userId)).get();

		const folders = await orm(c).select().from(folder)
			.where(eq(folder.userId, userId)).all();

		const emailCounts = await orm(c)
			.select({ folderId: email.folderId, total: count() })
			.from(email)
			.where(and(eq(email.userId, userId), eq(email.isDel, isDel.NORMAL)))
			.groupBy(email.folderId)
			.all();

		const countMap = {};
		emailCounts.forEach(row => { countMap[row.folderId] = row.total; });

		return {
			accountCount: accountCount.total,
			folderCount: folderCount.total,
			folders: folders.map(f => ({ ...f, emailCount: countMap[f.folderId] || 0 })),
			noFolderCount: countMap[0] || 0,
		};
	},

	async deleteByUserId(c, userId) {
		await orm(c).delete(folder).where(eq(folder.userId, userId)).run();
	}
};

export default folderService;
