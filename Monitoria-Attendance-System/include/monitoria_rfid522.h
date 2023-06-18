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
    void reset_previous_id();
    void cycle();

    String to_string();

    bool is_new_rfid_card();
    bool read_rfid_card();

    private:
    MFRC522 rfid;
    byte prev_id[4] = {0, 0, 0, 0}, new_id[4] = {0, 0, 0, 0};
};

#endif
