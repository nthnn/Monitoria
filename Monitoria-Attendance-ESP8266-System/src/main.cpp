#include <Arduino.h>
#include <SPI.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

#include "monitoria_config.h"
#include "monitoria_rfid522.h"
#include "monitoria_sim800l.h"

unsigned long prev_millis = 0;

MonitoriaRFID522 rfid(MONITORIA_MFRC522_SS, MONITORIA_MFRC522_RST);
MonitoriaSIM800L sim800l(MONITORIA_SIM800L_RX, MONITORIA_SIM800L_TX);

ESP8266WebServer server(80);

IPAddress local_ip(192, 168, 1, 1);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);

void handleCheck();
void handleRFID();
void handleDataReceived();

void setup() {
    Serial.begin(9600);
    SPI.begin();
    WiFi.disconnect();

    WiFi.hostname("monitoria.ai");
    WiFi.softAP(MONITORIA_SERVER_SSID, MONITORIA_SERVER_PASSWORD);
    WiFi.softAPConfig(local_ip, gateway, subnet);

    server.on("/check", handleCheck);
    server.on("/read", handleRFID);
    server.on("/receive", handleDataReceived);

    server.begin();
    rfid.init();
}

void handleCheck() {
    server.send(200, "text/plain", "OK");
}

void handleRFID() {
    rfid.cycle();

    if(rfid.read_rfid_card() && rfid.is_new_rfid_card())
        server.send(200, "application/json", rfid.to_string());
}

void handleDataReceived() {
    sim800l.send_sms(server.arg("message"), MONITORIA_SMS_MESSAGE);
}

void loop() {
    unsigned long curr_millis = millis();

    if(curr_millis - prev_millis > 5000) {
        prev_millis = curr_millis;
        rfid.reset_previous_id();
    }

    server.handleClient();
}
