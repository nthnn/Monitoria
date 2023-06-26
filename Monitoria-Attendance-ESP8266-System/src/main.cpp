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
    lcd.setCursor(0, 0);
    lcd.print("Idle...");

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

    pinMode(MONITORIA_LED_SUCCESS, OUTPUT);
    pinMode(MONITORIA_LED_FAIL, OUTPUT);
}

void loop() {
    unsigned long curr_millis = millis();
    if(curr_millis - prev_millis > 5000) {
        prev_millis = curr_millis;
        previous_hash = "";

        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Idle...");
    }
    else if(curr_millis - prev_millis > 1800) {
        rfid.reset_rfid();
    }
    else if(curr_millis - prev_millis > 1200) {
        digitalWrite(MONITORIA_LED_SUCCESS, LOW);
        digitalWrite(MONITORIA_LED_FAIL, LOW);
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

        server.send(200, "text/plain", "ERR");
        digitalWrite(MONITORIA_LED_FAIL, HIGH);

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
        lcd.setCursor(11, 1);
        lcd.print(server.arg("log_time"));

        server.send(200, "text/plain", "OK");
        sim800l.send_sms(server.arg("ent_cp"), MONITORIA_SMS_MESSAGE);

        digitalWrite(MONITORIA_LED_SUCCESS, HIGH);
        return;
    }

    server.send(200, "text/plain", "ERR");
    digitalWrite(MONITORIA_LED_FAIL, HIGH);
}