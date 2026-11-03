const dns = require("node:dns");
const net = require("node:net");

dns.setDefaultResultOrder("ipv4first");
net.setDefaultAutoSelectFamily(false);
