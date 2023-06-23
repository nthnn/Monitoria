#include "monitoria_rfid522.h"

void MonitoriaRFID522::init() {
    this->rfid.PCD_Reset();
    this->rfid.PCD_Init();
}

void MonitoriaRFID522::reset_rfid() {
    this->rfid.uid.uidByte[0] = 0;
    this->rfid.uid.uidByte[1] = 0;
    this->rfid.uid.uidByte[2] = 0;
    this->rfid.uid.uidByte[3] = 0;
}

bool MonitoriaRFID522::cycle() {
    this->rfid.PICC_IsNewCardPresent();
    return this->rfid.PICC_ReadCardSerial();
}

String MonitoriaRFID522::to_string() {
    if(this->rfid.uid.uidByte[0] == 0 &&
        this->rfid.uid.uidByte[1] == 0 &&
        this->rfid.uid.uidByte[2] == 0)
        return String("00-00-00-00");

    return String(this->rfid.uid.uidByte[0], HEX) + "-" +
        String(this->rfid.uid.uidByte[1], HEX) + "-" +
        String(this->rfid.uid.uidByte[2], HEX) + "-" +
        String(this->rfid.uid.uidByte[3], HEX);
}