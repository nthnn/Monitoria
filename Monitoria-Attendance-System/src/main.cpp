#include <Arduino.h>
#include <SPI.h>

#include "monitoria_config.h"
#include "monitoria_rfid522.h"
#include "monitoria_sim800l.h"

MonitoriaRFID522 rfid(MONITORIA_MFRC522_SS, MONITORIA_MFRC522_RST);
MonitoriaSIM800L sim800l(MONITORIA_SIM800L_RX, MONITORIA_SIM800L_TX);

void setup() {
    Serial.begin(9600);
    SPI.begin();

    rfid.init();
}

void loop() {
    rfid.cycle();
    if(rfid.read_rfid_card() && rfid.is_new_rfid_card())
        Serial.println(rfid.to_string());

    if(Serial.available())
        sim800l.send_sms(Serial.readString(), MONITORIA_SMS_MESSAGE);
}
