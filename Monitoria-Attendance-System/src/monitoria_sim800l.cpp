#include "monitoria_sim800l.h"

void MonitoriaSIM800L::send_sms(String phoneNumber, String message) {
    String months[] = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};

    int day, month, year, hour, minute, second;
    int cpnlen = phoneNumber.length(), smslen = 0;

    char *cpn, *smsmsg;
    phoneNumber.toCharArray(cpn, cpnlen);

    this->sim800l.updateRtc(8);
    this->sim800l.RTCtime(&day, &month, &year, &hour, &minute, &second);

    String sms = message + "\n\n" +
        months[month] + " " + String(day) + ", " + String(year) + " - " +
        String(hour) + ":" + String(minute) + ":" + String(second);

    smslen =  sms.length();
    sms.toCharArray(smsmsg, smslen);

    this->sim800l.sendSms(cpn, smsmsg);
}