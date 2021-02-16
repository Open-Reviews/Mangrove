import { rest } from 'msw';
import testResponses from './testPayloads';

export const handlers = [
    rest.get(`${process.env.WIDGET_APP_API_URL}/subject/:sub`, (req, res, ctx) => {
        return res(ctx.json(testResponses.subjectRespPayload))
    }),
    rest.get(`${process.env.WIDGET_APP_API_URL}/reviews`, (req, res, ctx) => {
        const kid = req.url.searchParams.get('kid');
        const limit = req.url.searchParams.get('limit');
        if (limit) {  //works like req.query.limit in express
            return res(ctx.json(testResponses.kidRespPayLoad))
        } else { //sub
            return res(ctx.json(testResponses.reviewsRespPayload))
        }
    }),
    rest.get(`${process.env.WIDGET_APP_API_URL}/issuer/:pem`, (req, res, ctx) => {
        return res(ctx.json(testResponses.issuerRespPayload))
    }),
]