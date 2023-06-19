#include <Arduino.h>
#include <SPI.h>

#include "monitoria_config.h"
#include "monitoria_rfid522.h"
#include "monitoria_sim800l.h"

unsigned long prev_millis = 0;

MonitoriaRFID522 rfid(MONITORIA_MFRC522_SS, MONITORIA_MFRC522_RST);
MonitoriaSIM800L sim800l(MONITORIA_SIM800L_RX, MONITORIA_SIM800L_TX);

void setup() {
    Serial.begin(9600);
    SPI.begin();

    rfid.init();
}

void loop() {
    unsigned long curr_millis = millis();

    if(curr_millis - prev_millis > 5000) {
        prev_millis = curr_millis;
        rfid.reset_previous_id();
    }

    rfid.cycle();
    if(rfid.read_rfid_card() && rfid.is_new_rfid_card())
        Serial.println(rfid.to_string());

    if(Serial.available())
        sim800l.send_sms(Serial.readString(), MONITORIA_SMS_MESSAGE);
}
