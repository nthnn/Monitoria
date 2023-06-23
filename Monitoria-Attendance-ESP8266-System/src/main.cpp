#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <LiquidCrystal_I2C.h>
#include <SPI.h>

#include "monitoria_config.h"
#include "monitoria_rfid522.h"
#include "monitoria_sim800l.h"

MonitoriaRFID522 rfid(MONITORIA_MFRC522_SS, MONITORIA_MFRC522_RST);
MonitoriaSIM800L sim800l(MONITORIA_SIM800L_RX, MONITORIA_SIM800L_TX);

ESP8266WebServer server(MONITORIA_SERVER_PORT);
LiquidCrystal_I2C lcd(MONITORIA_LCD_I2C_ADDRESS, MONITORIA_LCD_I2C_COLS, MONITORIA_LCD_I2C_ROWS);

unsigned long prev_millis = 0;
static String previous_hash = "";

void handleCheck();
void handleRFID();
void handleDataReceived();

void setup() {
    SPI.begin();
    rfid.init();

    lcd.init();
    lcd.backlight();

    WiFi.disconnect();
    WiFi.softAP(MONITORIA_SERVER_SSID, MONITORIA_SERVER_PASSWORD);
    WiFi.softAPConfig(
        IPAddress(MONITORIA_SERVER_LOCAL_IP), 
        IPAddress(MONITORIA_SERVER_GATEWAY),
        IPAddress(MONITORIA_SERVER_SUBNET));

    server.on("/check", handleCheck);
    server.on("/read", handleRFID);
    server.on("/data", handleDataReceived);
    server.begin();
}

void loop() {
    unsigned long curr_millis = millis();
    if(curr_millis - prev_millis > 3000) {
        prev_millis = curr_millis;
        rfid.reset_rfid();
    }

    server.handleClient();
}

void handleCheck() {
    server.send(200, "text/plain", "OK");
}

void handleRFID() {
    rfid.cycle();
    server.send(200, "text/plain", rfid.to_string());
}

void handleDataReceived() {
    if(server.arg("status").toInt() == 0) {
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Unregistered ID.");

        return;
    }
    else if(server.arg("status").toInt() == 1) {
        if(server.arg("hash") == previous_hash)
            return;
        previous_hash = server.arg("hash");

        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print(server.arg("ent_name"));
        lcd.setCursor(0, 1);
        lcd.print(server.arg("ent_id"));

        server.send(200, "text/plain", "OK");
        sim800l.send_sms(server.arg("ent_cp"), MONITORIA_SMS_MESSAGE);
    }
}