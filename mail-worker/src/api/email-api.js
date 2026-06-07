import app from '../hono/hono';
import emailService from '../service/email-service';
import result from '../model/result';
import userContext from '../security/user-context';
import attService from '../service/att-service';

app.get('/email/list', async (c) => {
	const data = await emailService.list(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.get('/email/latest', async (c) => {
	const list = await emailService.latest(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok(list));
});

app.get('/email/translation/status', async (c) => {
	const data = await emailService.translationStatus(c, c.req.query(), userContext.getUser(c));
	return c.json(result.ok(data));
});

app.delete('/email/delete', async (c) => {
	await emailService.delete(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.get('/email/attList', async (c) => {
	const attList = await attService.list(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok(attList));
});

app.post('/email/send', async (c) => {
	const email = await emailService.send(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok(email));
});

app.post('/email/translate', async (c) => {
	const data = await emailService.translate(c, await c.req.json(), userContext.getUser(c));
	return c.json(result.ok(data));
});

app.put('/email/read', async (c) => {
	await emailService.read(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.put('/email/spam', async (c) => {
	await emailService.setSpam(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.put('/email/important', async (c) => {
	await emailService.setImportant(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.put('/email/pin', async (c) => {
	await emailService.setPin(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.put('/email/folder', async (c) => {
	await emailService.setFolder(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});
