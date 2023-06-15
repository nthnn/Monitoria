#include "monitoria_rfid522.h"

void MonitoriaRFID522::init() {
    this->rfid.PCD_Init();
}

bool MonitoriaRFID522::cycle() {
    return this->rfid.PICC_IsNewCardPresent();
}

bool MonitoriaRFID522::read_rfid_card() {
    bool read = this->rfid.PICC_ReadCardSerial();

    for(byte i = 0; i < 4; i++) {
        if(this->prev_id[i] != this->rfid.uid.uidByte[i])
            this->prev_id[i] = this->new_id[i];

        this->new_id[i] = this->rfid.uid.uidByte[i];
    }

    return read;
}

bool MonitoriaRFID522::is_new_rfid_card() {
    for(byte i = 0; i < 4; i++)
        if(this->prev_id[i] != this->new_id[i]) {
            for(byte i = 0; i < 4; i++)
                this->prev_id[i] = this->new_id[i];

            return true;
        }

    return false;
}

String MonitoriaRFID522::to_string() {
    return String(this->new_id[0], HEX) + "-" +
        String(this->new_id[1], HEX) + "-" +
        String(this->new_id[2], HEX) + "-" +
        String(this->new_id[3], HEX);
}