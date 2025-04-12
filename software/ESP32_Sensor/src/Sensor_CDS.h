#pragma once
#include <Arduino.h>

class Sensor_CDS {
    private:
        int cds;
        int PIN_NUM;
        int error_count;

    public:
        Sensor_CDS(int pin);
        void read();
};
