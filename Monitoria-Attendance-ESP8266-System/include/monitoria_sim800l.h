#ifndef MONITORIA_SIM800L_H
#define MONITORIA_SIM800L_H

#include <Arduino.h>
//#include <Sim800L.h>

class MonitoriaSIM800L {
    public:
    MonitoriaSIM800L(uint16_t rx_pin, uint16_t tx_pin) {
        //this->sim800l = Sim800L(rx_pin, tx_pin);
        //this->sim800l.begin();
    }

    void send_sms(String phoneNumber, String message);

    private:
    //Sim800L sim800l;
};

#endif
