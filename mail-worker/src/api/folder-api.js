import app from '../hono/hono';
import folderService from '../service/folder-service';
import result from '../model/result';
import userContext from '../security/user-context';

app.get('/folder/list', async (c) => {
	const data = await folderService.list(c, userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.post('/folder/add', async (c) => {
	const data = await folderService.add(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.put('/folder/update', async (c) => {
	const data = await folderService.update(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.delete('/folder/delete', async (c) => {
	await folderService.delete(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.delete('/folder/batchDelete', async (c) => {
	await folderService.batchDelete(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.get('/folder/stats', async (c) => {
	const data = await folderService.stats(c, userContext.getUserId(c));
	return c.json(result.ok(data));
});
