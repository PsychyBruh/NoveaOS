import { dirname, join } from 'node:path';
import { fileURLToPath } from 'url';
import wisp from 'wisp-server-node';
import p2p from './p2p.js';
import express from 'express';
import http from 'http';

const app = express();
const server = http.createServer(app);
const port = 3000;
const path = join(dirname(fileURLToPath(import.meta.url)), '..', 'build');

app.use(express.static(path));
server.on('upgrade', (req, socket, head) => {
    if (req.url.endsWith('/wisp/')) {
        wisp.routeRequest(req, socket, head);
    } else if (req.url.endsWith('/p2p/')) {
        p2p.routeRequest({
            request: req,
            socket: socket,
            head: head,
            conf: {
                logging: true,
                blockedIps: []
            }
        });
    }
});
server.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
});
