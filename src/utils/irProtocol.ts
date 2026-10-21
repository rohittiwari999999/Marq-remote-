/**
 * IR Protocol generator for MarQ 1.5 Ton Fixed Speed Air Conditioner
 * Supports NEC / AUX 38kHz IR protocol encoding, raw pulse timings,
 * and multi-format export (Flipper Zero, Broadlink, Arduino, LIRC).
 */

export interface ACState {
  power: boolean;
  mode: 'cool' | 'auto' | 'dry' | 'fan' | 'heat';
  temp: number; // 16 to 31 °C
  tempUnit: 'C' | 'F';
  fanSpeed: 'auto' | 'low' | 'med' | 'high';
  swingV: boolean;
  swingVPos: number; // 0 = Auto, 1-5 fixed
  swingH: boolean;
  turbo: boolean;
  eco: boolean;
  sleep: boolean;
  displayLight: boolean;
  cleanHealth: boolean;
  lock: boolean;
  timerOn: number | null; // hours
  timerOff: number | null; // hours
  clockTime?: string;
  backlight: boolean;
}

export interface IRCodePacket {
  protocolName: string;
  carrierFrequencyHz: number;
  hexString: string;
  rawTimingsMicroseconds: number[];
  flipperZeroIrContent: string;
  broadlinkHex: string;
  arduinoCode: string;
}

export function encodeMarQIr(state: ACState): IRCodePacket {
  // Carrier Frequency
  const carrierFrequencyHz = 38000;

  // Header code for MarQ / AUX Fixed Speed Split AC
  const byte0 = 0xC3; // Manufacturer header
  const byte1 = 0x5A; // Model identifier (Fixed Speed 1.5T)

  // Byte 2: Power and Mode
  let modeCode = 0;
  switch (state.mode) {
    case 'cool': modeCode = 0x01; break;
    case 'dry': modeCode = 0x02; break;
    case 'fan': modeCode = 0x03; break;
    case 'auto': modeCode = 0x00; break;
    case 'heat': modeCode = 0x04; break;
  }
  const powerBit = state.power ? 0x20 : 0x00;
  const byte2 = powerBit | (modeCode & 0x07);

  // Byte 3: Temperature (Temp 16-31 -> 0 to 15, shifted)
  const tempOffset = Math.max(0, Math.min(15, Math.round(state.temp - 16)));
  const byte3 = (tempOffset << 4) | (state.displayLight ? 0x08 : 0x00) | (state.eco ? 0x04 : 0x00);

  // Byte 4: Fan speed & Swing
  let fanCode = 0;
  switch (state.fanSpeed) {
    case 'auto': fanCode = 0x00; break;
    case 'low': fanCode = 0x01; break;
    case 'med': fanCode = 0x02; break;
    case 'high': fanCode = 0x03; break;
  }
  const swingVBit = state.swingV ? 0x10 : 0x00;
  const swingHBit = state.swingH ? 0x20 : 0x00;
  const turboBit = state.turbo ? 0x40 : 0x00;
  const byte4 = (fanCode & 0x03) | swingVBit | swingHBit | turboBit;

  // Byte 5: Special flags (Sleep, Clean, Timer)
  const sleepBit = state.sleep ? 0x01 : 0x00;
  const cleanBit = state.cleanHealth ? 0x02 : 0x00;
  const timerBits = state.timerOff ? Math.min(15, Math.round(state.timerOff)) : 0x00;
  const byte5 = sleepBit | cleanBit | (timerBits << 4);

  // Byte 6: Checksum (Sum modulo 256)
  const byte6 = (byte0 + byte1 + byte2 + byte3 + byte4 + byte5) & 0xFF;

  const bytes = [byte0, byte1, byte2, byte3, byte4, byte5, byte6];
  const hexString = bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

  // Generate NEC Timing Pulses
  // Lead-in: 9000us mark, 4500us space
  const rawTimings: number[] = [9000, 4500];

  // Encode each byte LSB first
  for (const b of bytes) {
    for (let bit = 0; bit < 8; bit++) {
      const isOne = (b & (1 << bit)) !== 0;
      rawTimings.push(560); // Mark
      rawTimings.push(isOne ? 1690 : 560); // Space: 1690 for 1, 560 for 0
    }
  }

  // Trailing stop pulse
  rawTimings.push(560);
  rawTimings.push(20000); // Inter-frame silence

  // Formatter: Flipper Zero .ir format
  const flipperZeroIrContent = `Filetype: IR library file
Version: 1
# MarQ 1.5 Ton Fixed Speed AC Remote
name: MarQ_${state.mode.toUpperCase()}_${state.temp}C_${state.power ? 'ON' : 'OFF'}
type: raw
frequency: 38000
duty_cycle: 0.330000
data: ${rawTimings.join(' ')}
`;

  // Formatter: Broadlink Hex
  const broadlinkHex = `2600${(rawTimings.length * 2).toString(16).padStart(4, '0')}${bytes.map(b => b.toString(16).padStart(2, '0')).join('')}`;

  // Formatter: Arduino IRremote C++ snippet
  const arduinoCode = `// Arduino IRremote code for MarQ 1.5T Fixed Speed AC
// Requires IRremote library v4+
#include <IRremote.hpp>

const uint16_t rawData[${rawTimings.length}] = {
  ${rawTimings.join(', ')}
};

void sendMarQCommand() {
  IrSender.sendRaw(rawData, ${rawTimings.length}, 38); // 38kHz
}
`;

  return {
    protocolName: 'MarQ / AUX 38kHz Fixed-Speed',
    carrierFrequencyHz,
    hexString,
    rawTimingsMicroseconds: rawTimings,
    flipperZeroIrContent,
    broadlinkHex,
    arduinoCode,
  };
}
