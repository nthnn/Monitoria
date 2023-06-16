#include "monitoria_sim800l.h"

void MonitoriaSIM800L::send_sms(String phoneNumber, String message) {
    String months[] = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
    int day, month, year, hour, minute, second;

    String sms = message + "\n\n" +
        months[month] + " " + String(day) + ", " + String(year) + " - " +
        String(hour) + ":" + String(minute) + ":" + String(second);

    int cpnlen = phoneNumber.length(), smslen = sms.length();
    char *cpn, *smsmsg;

    phoneNumber.toCharArray(cpn, cpnlen);
    sms.toCharArray(smsmsg, smslen);

    Serial.println("Updating RTC...");
    this->sim800l.updateRtc(8);

    Serial.println("Getting time and date...");
    this->sim800l.RTCtime(&day, &month, &year, &hour, &minute, &second);

    Serial.println("RTC: " + months[month] + " " + String(day) + ", " + String(year) + " - " +
        String(hour) + ":" + String(minute) + ":" + String(second));
    Serial.println("Sending SMS to " + String(cpn) + "...");

    this->sim800l.sendSms(cpn, smsmsg);
    Serial.println("Sent SMS to: " + String(cpn));
}