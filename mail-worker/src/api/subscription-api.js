import app from '../hono/hono';
import subscriptionService from '../service/subscription-service';
import result from '../model/result';
import userContext from '../security/user-context';

app.get('/subscription/list', async (c) => {
	const data = await subscriptionService.list(c, userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.post('/subscription/add', async (c) => {
	const data = await subscriptionService.add(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.delete('/subscription/delete', async (c) => {
	await subscriptionService.delete(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok());
});
