import { Server } from "@hocuspocus/server";

// Minimal Hocuspocus server for Drawly Stage 2
const server = new Server({
  port: 1234,
  
  // In MVP, we allow all connections (anonymous collaboration)
  async onAuthenticate() {
    return true;
  },

  async onConnect() {
    console.log("New connection established");
  },

  async onDisconnect() {
    console.log("Connection closed");
  },
});

server.listen().then(() => {
  console.log("Drawly Hocuspocus server is running on port 1234");
});
