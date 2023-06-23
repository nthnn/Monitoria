#include <Arduino.h>
#include <SPI.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

#include "monitoria_config.h"
#include "monitoria_rfid522.h"
#include "monitoria_sim800l.h"

MonitoriaRFID522 rfid(MONITORIA_MFRC522_SS, MONITORIA_MFRC522_RST);
MonitoriaSIM800L sim800l(MONITORIA_SIM800L_RX, MONITORIA_SIM800L_TX);

ESP8266WebServer server(MONITORIA_SERVER_PORT);

void handleCheck();
void handleRFID();
void handleDataReceived();

void setup() {
    SPI.begin();
    WiFi.disconnect();

    WiFi.hostname("monitoria.ai");
    WiFi.softAP(MONITORIA_SERVER_SSID, MONITORIA_SERVER_PASSWORD);
    WiFi.softAPConfig(
        IPAddress(MONITORIA_SERVER_LOCAL_IP), 
        IPAddress(MONITORIA_SERVER_GATEWAY),
        IPAddress(MONITORIA_SERVER_SUBNET));

    server.on("/check", handleCheck);
    server.on("/read", handleRFID);
    server.on("/data", handleDataReceived);

    server.begin();
    rfid.init();
}

void handleCheck() {
    server.send(200, "text/plain", "OK");
}

void handleRFID() {
    rfid.cycle();
    server.send(200, "text/plain", rfid.to_string());
}

void handleDataReceived() {
    server.send(200, "text/plain", "OK");
    sim800l.send_sms(server.arg("message"), MONITORIA_SMS_MESSAGE);
}

void loop() {
    server.handleClient();
}