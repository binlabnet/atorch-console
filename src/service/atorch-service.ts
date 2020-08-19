import { EventEmitter } from 'events';
import {
  readPacket,
  PacketType,
  HEADER,
  assertPacket,
  MessageType,
} from './atorch-packet';

const UUID_SERVICE = '0000ffe0-0000-1000-8000-00805f9b34fb';
const UUID_CHARACTERISTIC = '0000ffe1-0000-1000-8000-00805f9b34fb';

const EVENT_CONNECTED = 'connected';
const EVENT_WRONG = 'wrong';
const EVENT_PACKET = 'packet';

interface Events {
  availability(available: boolean): void;
  connected(connected: boolean): void;
  wrong(packet: Buffer): void;
  packet(packet: PacketType): void;
}

export class AtorchService {
  public static async requestDevice() {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [UUID_SERVICE] }],
    });
    return new AtorchService(device);
  }

  private blocks: Buffer[] = [];
  private events = new EventEmitter();
  private device: BluetoothDevice;
  private characteristic: BluetoothRemoteGATTCharacteristic | undefined;
  private keepalive = true;

  private constructor(device: BluetoothDevice) {
    this.device = device;
    device.addEventListener('gattserverdisconnected', () => {
      if (!this.keepalive) {
        return;
      }
      this.events.emit(EVENT_CONNECTED, false);
      this.reconnect();
    });
  }

  public async connect() {
    const server = await this.device.gatt?.connect();
    const service = await server?.getPrimaryService(UUID_SERVICE);

    const characteristic = await service?.getCharacteristic(
      UUID_CHARACTERISTIC,
    );
    characteristic?.addEventListener(
      'characteristicvaluechanged',
      this.handleValueChanged,
    );
    await characteristic?.startNotifications();

    this.characteristic = characteristic;

    this.events.emit(EVENT_CONNECTED, true);
  }

  public async reconnect() {
    const isDisconnected = () => !(this.device.gatt?.connected ?? false);
    while (this.keepalive && isDisconnected()) {
      console.log('retry reconnecting');
      await this.connect();
    }
  }

  public async disconnect() {
    this.keepalive = false;
    try {
      await this.characteristic?.stopNotifications();
      this.device.gatt?.disconnect();
    } catch {
      // ignore
    }
    this.events.emit(EVENT_CONNECTED, false);
  }

  public async sendCommand(block: Buffer) {
    assertPacket(block, MessageType.Command);
    return this.characteristic?.writeValue(block);
  }

  public on<K extends keyof Events>(event: K, listener: Events[K]): () => void;
  public on(event: string, listener: (...args: unknown[]) => void) {
    this.events.on(event, listener);
    return () => {
      this.events.off(event, listener);
    };
  }

  private handleValueChanged = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const payload = Buffer.from(target.value?.buffer ?? []);
    if (payload.indexOf(HEADER) === 0) {
      if (this.blocks.length !== 0) {
        this.emitBlock(Buffer.concat(this.blocks));
      }
      this.blocks = [payload];
    } else {
      this.blocks.push(payload);
    }
  };

  private emitBlock(block: Buffer) {
    console.log('Block', block.toString('hex').toUpperCase());
    try {
      const packet = readPacket(block);
      this.events.emit(EVENT_PACKET, packet);
    } catch {
      this.events.emit(EVENT_WRONG, block);
    }
  }
}
