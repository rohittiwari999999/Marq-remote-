/**
 * IR Protocol generator for MarQ 1.5 Ton Fixed Speed Air Conditioner
 * Supports multiple OEM hardware profiles (AUX / Upix 231M, TCL, Midea),
 * raw microsecond pulse arrays, and multi-format exports.
 */

export type MarQProtocolType = 'aux_upix231' | 'tcl_marq' | 'midea_marq';

export interface ProtocolProfile {
  id: MarQProtocolType;
  name: string;
  oem: string;
  description: string;
  remoteModel: string;
  frequencyHz: number;
}

export const PROTOCOL_PROFILES: ProtocolProfile[] = [
  {
    id: 'aux_upix231',
    name: 'Profile 1: Upix 231M / AUX OEM (Recommended)',
    oem: 'AUX Group / MarQ Fixed Speed',
    description: 'Exact match for physical Upix No. 231M remote and MarQ FKAC153SFA 1.5T 3-Star AC.',
    remoteModel: 'Upix 231M / YKR-H/102E',
    frequencyHz: 38000,
  },
  {
    id: 'tcl_marq',
    name: 'Profile 2: TCL OEM (56-Bit)',
    oem: 'TCL Overseas / MarQ Split',
    description: 'Used in MarQ batches with TCL indoor motherboards (TAC-18CS / GYKQ).',
    remoteModel: 'GYKQ-34 / TAC',
    frequencyHz: 38000,
  },
  {
    id: 'midea_marq',
    name: 'Profile 3: Midea / Carrier OEM (48-Bit)',
    oem: 'Midea Group / MarQ',
    description: 'Used in select MarQ models with inverted byte checksum.',
    remoteModel: 'R51M / RG57',
    frequencyHz: 38000,
  },
];

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
  activeProtocol?: MarQProtocolType;
}

export interface IRCodePacket {
  protocolId: MarQProtocolType;
  protocolName: string;
  carrierFrequencyHz: number;
  hexString: string;
  rawTimingsMicroseconds: number[];
  flipperZeroIrContent: string;
  broadlinkHex: string;
  arduinoCode: string;
}

/**
 * Encode AUX / Upix 231M format (Standard MarQ 1.5T Fixed Speed)
 */
function encodeAuxUpix231(state: ACState): IRCodePacket {
  const carrierFrequencyHz = 38000;
  const byte0 = 0xC3; // Manufacturer header
  const byte1 = 0x5A; // Model identifier (Fixed Speed 1.5T)

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

  const tempOffset = Math.max(0, Math.min(15, Math.round(state.temp - 16)));
  const byte3 = (tempOffset << 4) | (state.displayLight ? 0x08 : 0x00) | (state.eco ? 0x04 : 0x00);

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

  const sleepBit = state.sleep ? 0x01 : 0x00;
  const cleanBit = state.cleanHealth ? 0x02 : 0x00;
  const timerBits = state.timerOff ? Math.min(15, Math.round(state.timerOff)) : 0x00;
  const byte5 = sleepBit | cleanBit | (timerBits << 4);

  const byte6 = (byte0 + byte1 + byte2 + byte3 + byte4 + byte5) & 0xFF;
  const bytes = [byte0, byte1, byte2, byte3, byte4, byte5, byte6];
  const hexString = bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

  // Lead-in: 9000us mark, 4500us space
  const rawTimings: number[] = [9000, 4500];
  for (const b of bytes) {
    for (let bit = 0; bit < 8; bit++) {
      const isOne = (b & (1 << bit)) !== 0;
      rawTimings.push(560);
      rawTimings.push(isOne ? 1690 : 560);
    }
  }
  rawTimings.push(560);
  rawTimings.push(20000);

  return buildPacket('aux_upix231', 'MarQ / Upix 231M (AUX 38kHz)', carrierFrequencyHz, hexString, rawTimings, state);
}

/**
 * Encode TCL format (Used in certain MarQ batches)
 */
function encodeTclMarQ(state: ACState): IRCodePacket {
  const carrierFrequencyHz = 38000;
  const byte0 = 0x23; // TCL AC Header
  const byte1 = 0xCB;
  const byte2 = 0x26;
  const byte3 = 0x01;

  let modeCode = 0;
  switch (state.mode) {
    case 'cool': modeCode = 0x03; break;
    case 'dry': modeCode = 0x02; break;
    case 'fan': modeCode = 0x07; break;
    case 'auto': modeCode = 0x08; break;
    case 'heat': modeCode = 0x01; break;
  }
  const powerBit = state.power ? 0x04 : 0x00;
  const byte4 = (modeCode << 3) | powerBit;

  const tempVal = Math.max(16, Math.min(31, Math.round(state.temp)));
  const byte5 = (31 - tempVal) & 0x0F;
  const byte6 = (byte0 ^ byte1 ^ byte2 ^ byte3 ^ byte4 ^ byte5) & 0xFF;

  const bytes = [byte0, byte1, byte2, byte3, byte4, byte5, byte6];
  const hexString = bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

  // TCL Timings: 3000 mark, 3000 space
  const rawTimings: number[] = [3000, 3000];
  for (const b of bytes) {
    for (let bit = 0; bit < 8; bit++) {
      const isOne = (b & (1 << bit)) !== 0;
      rawTimings.push(500);
      rawTimings.push(isOne ? 1500 : 500);
    }
  }
  rawTimings.push(500);
  rawTimings.push(10000);

  return buildPacket('tcl_marq', 'MarQ / TCL OEM 56-Bit', carrierFrequencyHz, hexString, rawTimings, state);
}

/**
 * Encode Midea / Carrier format (Used in select MarQ models)
 */
function encodeMideaMarQ(state: ACState): IRCodePacket {
  const carrierFrequencyHz = 38000;
  const byte0 = 0xB2; // Midea AC header
  const byte1 = 0x4D; // ~0xB2 checksum byte

  let modeCode = 0;
  switch (state.mode) {
    case 'cool': modeCode = 0x00; break;
    case 'dry': modeCode = 0x01; break;
    case 'auto': modeCode = 0x02; break;
    case 'heat': modeCode = 0x03; break;
    case 'fan': modeCode = 0x04; break;
  }
  const tempOffset = Math.max(0, Math.min(15, Math.round(state.temp - 17)));
  const byte2 = (modeCode << 5) | (tempOffset & 0x0F);
  const byte3 = (~byte2) & 0xFF;

  let fanCode = 0;
  switch (state.fanSpeed) {
    case 'auto': fanCode = 0x05; break;
    case 'low': fanCode = 0x04; break;
    case 'med': fanCode = 0x02; break;
    case 'high': fanCode = 0x01; break;
  }
  const byte4 = (fanCode << 5) | (state.power ? 0x00 : 0x07);
  const byte5 = (~byte4) & 0xFF;

  const bytes = [byte0, byte1, byte2, byte3, byte4, byte5];
  const hexString = bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

  // Midea Timings: 4400us mark, 4400us space
  const rawTimings: number[] = [4400, 4400];
  for (const b of bytes) {
    for (let bit = 7; bit >= 0; bit--) {
      const isOne = (b & (1 << bit)) !== 0;
      rawTimings.push(540);
      rawTimings.push(isOne ? 1620 : 540);
    }
  }
  rawTimings.push(540);
  rawTimings.push(10000);

  return buildPacket('midea_marq', 'MarQ / Midea OEM 48-Bit', carrierFrequencyHz, hexString, rawTimings, state);
}

function buildPacket(
  protocolId: MarQProtocolType, 
  protocolName: string, 
  carrierFrequencyHz: number, 
  hexString: string, 
  rawTimings: number[], 
  state: ACState
): IRCodePacket {
  const flipperZeroIrContent = `Filetype: IR library file
Version: 1
# MarQ AC Remote (${protocolName})
name: MarQ_${state.mode.toUpperCase()}_${state.temp}C_${state.power ? 'ON' : 'OFF'}
type: raw
frequency: ${carrierFrequencyHz}
duty_cycle: 0.330000
data: ${rawTimings.join(' ')}
`;

  const broadlinkHex = `2600${(rawTimings.length * 2).toString(16).padStart(4, '0')}${rawTimings.map(t => Math.min(255, Math.round(t / 8)).toString(16).padStart(2, '0')).slice(0, 40).join('')}`;

  const arduinoCode = `// Arduino IRremote code for MarQ AC (${protocolName})
#include <IRremote.hpp>

const uint16_t rawData[${rawTimings.length}] = {
  ${rawTimings.join(', ')}
};

void sendMarQCommand() {
  IrSender.sendRaw(rawData, ${rawTimings.length}, 38); // 38kHz
}
`;

  return {
    protocolId,
    protocolName,
    carrierFrequencyHz,
    hexString,
    rawTimingsMicroseconds: rawTimings,
    flipperZeroIrContent,
    broadlinkHex,
    arduinoCode,
  };
}

export function encodeMarQIr(state: ACState, protocolOverride?: MarQProtocolType): IRCodePacket {
  const proto = protocolOverride || state.activeProtocol || 'aux_upix231';
  switch (proto) {
    case 'tcl_marq':
      return encodeTclMarQ(state);
    case 'midea_marq':
      return encodeMideaMarQ(state);
    case 'aux_upix231':
    default:
      return encodeAuxUpix231(state);
  }
}
