import { assertMeterPacket, assertPacket } from './asserts';
import { PER_MILI_WATT_HOUR_CO2 } from './constants';
import { MessageType } from './types';
import { readDuration, readUInt24BE } from './utils';

const type = 0x02;

export class DCMeterPacket {
  public static readonly type = type;

  public readonly mVoltage: number;
  public readonly mAmpere: number;
  public readonly mWh: number;
  public readonly mWatt: number;
  public readonly co2: number;
  public readonly price: number;
  public readonly fee: number;
  public readonly temperature: number;
  public readonly duration: string;
  public readonly backlightTime: number;

  public constructor(block: Buffer, co2Factor = PER_MILI_WATT_HOUR_CO2) {
    assertPacket(block, MessageType.Report);
    assertMeterPacket(block, type, 'DC Meter');
    this.mVoltage = readUInt24BE(block, 0x04) * 100;
    this.mAmpere = readUInt24BE(block, 0x07);
    this.mWh = block.readUInt32BE(0x0a) * 10;
    this.mWatt = Math.round((this.mVoltage * this.mAmpere) / 1000);
    this.co2 = Math.round(this.mWh * co2Factor);
    this.price = readUInt24BE(block, 0x11) / 100;
    this.fee = (this.mWh * this.price) / 1000000;
    this.temperature = block.readUInt16BE(0x18);
    this.duration = readDuration(block, 0x1a);
    this.backlightTime = block[0x1e];
    Object.freeze(this);
    Object.seal(this);
  }
}
