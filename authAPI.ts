/**
 * Required External Modules
 */
 import * as dotenv from "dotenv";
 dotenv.config();
 import express from "express";
 import cors from "cors";
 import helmet from "helmet";

 import { Request, Response } from "express";
 
import * as jwt from "jsonwebtoken"

/******************************************** THIS IS AN AUTH SERVICE DESGINED TO BE A STAND ALONE SERVICE  *****************************/

const PORT: number = parseInt(process.env.AUTH_API_PORT as string, 10) || 4000;

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type, Accept, Authorization' );
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
    });

/*
Health check for load balancer - DO NOT DELETE!
*/
app.get("/health", (req: Request, res: Response) => {
    try {
      res.status(200).send("healthy");
    } catch (e: any) {
      res.status(500).send(e);
    }
  });

function genAccessToken (user: object) {
  if (process.env.ACCESS_TOKEN_SECRET === undefined) throw `no secret found, unable to sign jwt token for user ${user} `
  const secret: string = process.env.ACCESS_TOKEN_SECRET
  const accessToken = jwt.sign(user, secret, {expiresIn: process.env.AUTH_JWT_TOKEN_EXPIRE})
  return accessToken
}

app.post("/login", async (req: Request, res: Response) => {
    try {
      const username = req.body.username
      const password = req.body.password
      //TODO:: add logic for user managment here, current only allowing test user
      if (!(username === 'Tal' && password === 'Tal_passwod')) {
        return res.sendStatus(403)
      }
      const user = { name: username } 
      const accessToken = genAccessToken(user)

      if (process.env.REFRESH_ACCESS_TOKEN_SECRET === undefined) throw `no refresh secret found, unable to sign refresh jwt token for user ${username} `
      const refresh_secret: string = process.env.REFRESH_ACCESS_TOKEN_SECRET
      const refreshAccessToken = jwt.sign(user, refresh_secret)
      refreshAccessTokens.push(refreshAccessToken)

      res.json({ accessToken: accessToken, refreshToken: refreshAccessToken })
    } catch (e) {
      console.error("unable to login user, " , e)
    }
  });

  //TODO:: store this in mongo later
  let refreshAccessTokens: string[] = []
  app.post("/tokenRefresh", async (req: Request, res: Response) => {
    try {
      const refreshToken = req.body.refreshToken
      if ( refreshToken && !refreshAccessTokens.includes(refreshToken) ) return res.sendStatus(401)

      if (process.env.REFRESH_ACCESS_TOKEN_SECRET === undefined) throw `no refresh secret found, unable to sign refresh jwt token for user  `
      const refresh_secret: string = process.env.REFRESH_ACCESS_TOKEN_SECRET
      jwt.verify(refreshToken, refresh_secret, (err: any, user: any) => {
        if (err) return res.sendStatus(403)
        const accessToken = genAccessToken({ name: user?.name})
        res.json({ accessToken: accessToken })
      })
    } catch (e) {
      console.error("unable to login user after token refresh, " , e)
    }
  });

  app.delete('/logout', async (req: Request, res: Response) => {
    //remove the token from the list
    refreshAccessTokens = refreshAccessTokens.filter(token => token !== req.body.token)
    res.sendStatus(204)
  } )
/**
 * Server Activation
 */
 app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });

  
