const $ = require("jquery");
const SerialPort = require("serialport").SerialPort;
const sqlite3 = require("sqlite3").verbose();
const md5 = require("md5");
const base64 = require("base-64");
const { ReadlineParser } = require("@serialport/parser-readline");

require("bootstrap");

window.jQuery = $;