#ifndef MONITORIA_RFID522_H
#define MONITORIA_RFID522_H

#include <Arduino.h>
#include <MFRC522.h>

class MonitoriaRFID522 {
    public:
    MonitoriaRFID522(uint16_t ss_pin, uint16_t rst_pin) {
        this->rfid = MFRC522(ss_pin, rst_pin);
    }

    void init();
    bool cycle();

    String to_string();

    private:
    MFRC522 rfid;
};

#endif
