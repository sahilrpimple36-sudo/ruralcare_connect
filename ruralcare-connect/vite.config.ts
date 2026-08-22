import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// Central in-memory store for local network cross-device sync
const networkDbStore: Record<string, any[]> = {};
// Real-time video frame relay: { [channelId]: { [userId]: { frame: string, camOff: boolean, timestamp: number } } }
const liveVideoFrames: Record<string, Record<string, { frame: string; camOff?: boolean; timestamp: number }>> = {};
// Real-time audio stream relay: { [channelId]: { [userId]: Array<{ id: number, audio?: string, pcm?: string, timestamp: number }> } }
const liveAudioChunks: Record<string, Record<string, Array<{ id: number; audio?: string; pcm?: string; timestamp: number }>>> = {};

function localNetworkSyncPlugin(): Plugin {
  return {
    name: 'local-network-sync-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Handle Video Frame Stream Relay (/api/stream/:channel/:userId)
        if (req.url?.startsWith('/api/stream')) {
          const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const segments = url.pathname.replace('/api/stream', '').split('/').filter(Boolean);
          const channelId = segments[0];
          const userId = segments[1];

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }

          if (!channelId) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing channelId' }));
            return;
          }

          if (!liveVideoFrames[channelId]) {
            liveVideoFrames[channelId] = {};
          }

          // GET /api/stream/:channelId/:peerId -> Get latest frame for peer
          if (req.method === 'GET') {
            if (userId) {
              const peerData = liveVideoFrames[channelId][userId] || null;
              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  frame: peerData?.frame || null,
                  camOff: peerData?.camOff || false,
                  timestamp: peerData?.timestamp || 0
                })
              );
              return;
            }
            res.statusCode = 200;
            res.end(JSON.stringify(liveVideoFrames[channelId]));
            return;
          }

          // POST /api/stream/:channelId/:userId -> Broadcast camera frame or camOff
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                if (userId) {
                  if (data.camOff) {
                    liveVideoFrames[channelId][userId] = {
                      frame: '',
                      camOff: true,
                      timestamp: Date.now()
                    };
                  } else if (data.frame) {
                    liveVideoFrames[channelId][userId] = {
                      frame: data.frame,
                      camOff: false,
                      timestamp: Date.now()
                    };
                  }
                }
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true }));
              } catch (e: any) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
            return;
          }
          return next();
        }

        // Handle Audio Stream Relay (/api/audio/:channel/:userId)
        if (req.url?.startsWith('/api/audio')) {
          const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const segments = url.pathname.replace('/api/audio', '').split('/').filter(Boolean);
          const channelId = segments[0];
          const userId = segments[1];

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }

          if (!channelId) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing channelId' }));
            return;
          }

          if (!liveAudioChunks[channelId]) {
            liveAudioChunks[channelId] = {};
          }
          if (userId && !liveAudioChunks[channelId][userId]) {
            liveAudioChunks[channelId][userId] = [];
          }

          // GET /api/audio/:channelId/:peerId?since=xxx
          if (req.method === 'GET') {
            const since = parseInt(url.searchParams.get('since') || '0', 10);
            const peerChunks = (userId ? liveAudioChunks[channelId][userId] : []) || [];
            const newChunks = peerChunks.filter(c => c.id > since);
            res.statusCode = 200;
            res.end(JSON.stringify({ chunks: newChunks }));
            return;
          }

          // POST /api/audio/:channelId/:userId -> Broadcast audio chunk
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                if ((data.pcm || data.audio) && userId) {
                  const chunkId = Date.now();
                  const list = liveAudioChunks[channelId][userId] || [];
                  list.push({ id: chunkId, pcm: data.pcm || data.audio, audio: data.audio || data.pcm, timestamp: chunkId });
                  // Keep only recent 25 chunks
                  if (list.length > 25) {
                    list.splice(0, list.length - 25);
                  }
                  liveAudioChunks[channelId][userId] = list;
                }
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true }));
              } catch (e: any) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
            return;
          }
          return next();
        }

        // Handle DB Storage Sync (/api/db)
        if (!req.url?.startsWith('/api/db')) {
          return next();
        }

        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathSegments = url.pathname.replace('/api/db', '').split('/').filter(Boolean);
        const collection = pathSegments[0];

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        // GET /api/db -> return all collections
        if (!collection) {
          if (req.method === 'GET') {
            res.statusCode = 200;
            res.end(JSON.stringify(networkDbStore));
            return;
          }
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const fullDump = JSON.parse(body);
                Object.keys(fullDump).forEach(key => {
                  if (!networkDbStore[key]) networkDbStore[key] = [];
                  if (Array.isArray(fullDump[key])) {
                    fullDump[key].forEach((incomingItem: any) => {
                      if (incomingItem && incomingItem.id) {
                        const existingIdx = networkDbStore[key].findIndex((i: any) => i.id === incomingItem.id);
                        if (existingIdx > -1) {
                          networkDbStore[key][existingIdx] = { ...networkDbStore[key][existingIdx], ...incomingItem };
                        } else {
                          networkDbStore[key].push(incomingItem);
                        }
                      }
                    });
                  }
                });
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true }));
              } catch (e: any) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
            return;
          }
          return next();
        }

        if (!networkDbStore[collection]) {
          networkDbStore[collection] = [];
        }

        // GET /api/db/:collection
        if (req.method === 'GET') {
          res.statusCode = 200;
          res.end(JSON.stringify(networkDbStore[collection]));
          return;
        }

        // POST/PUT /api/db/:collection
        if (req.method === 'POST' || req.method === 'PUT') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              if (Array.isArray(data)) {
                data.forEach((incomingItem: any) => {
                  if (incomingItem && incomingItem.id) {
                    const idx = networkDbStore[collection].findIndex((item: any) => item.id === incomingItem.id);
                    if (idx > -1) {
                      networkDbStore[collection][idx] = { ...networkDbStore[collection][idx], ...incomingItem };
                    } else {
                      networkDbStore[collection].push(incomingItem);
                    }
                  }
                });
              } else if (data && data.id) {
                const idx = networkDbStore[collection].findIndex((item: any) => item.id === data.id);
                if (idx > -1) {
                  networkDbStore[collection][idx] = { ...networkDbStore[collection][idx], ...data };
                } else {
                  networkDbStore[collection].push(data);
                }
              }
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, count: networkDbStore[collection].length }));
            } catch (e: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        // DELETE /api/db/:collection/:id
        if (req.method === 'DELETE') {
          const docId = pathSegments[1];
          if (docId) {
            networkDbStore[collection] = networkDbStore[collection].filter((item: any) => item.id !== docId);
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true }));
            return;
          }
        }

        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl(), localNetworkSyncPlugin()],
  server: {
    host: true, // Listen on all network interfaces (0.0.0.0)
    port: 5173
  }
});
