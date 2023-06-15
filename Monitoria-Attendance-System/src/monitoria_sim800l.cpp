#include "monitoria_sim800l.h"

void MonitoriaSIM800L::send_sms(String phoneNumber, String message) {
    String months[] = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};

    int day, month, year, hour, minute, second;
    this->sim800l.RTCtime(&day, &month, &year, &hour, &minute, &second);

    String sms = message + "\n\n" +
        months[month] + " " + String(day) + ", " + String(year) + " - " +
        String(hour) + ":" + String(minute) + ":" + String(second);
    
    int cpnlen = phoneNumber.length(), smslen = sms.length();
    char *cpn, *smsmsg;

    phoneNumber.toCharArray(cpn, cpnlen);
    sms.toCharArray(smsmsg, smslen);

    this->sim800l.sendSms(cpn, smsmsg);
}