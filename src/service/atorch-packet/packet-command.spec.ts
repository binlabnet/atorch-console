import { assert, use } from 'chai';
import chaiBytes from 'chai-bytes';
import 'mocha';
import cmd from './packet-command';

use(chaiBytes);

describe('Command', () => {
  const entries: [string, Buffer][] = [
    ['FF551101010000000057', cmd.resetWh(0x01)],
    ['FF551101020000000050', cmd.resetAh(0x01)],
    ['FF551101030000000051', cmd.resetDuration(0x01)],
    ['FF551101050000000053', cmd.resetAll(0x01)],
    ['FF551101210000000170', cmd.setBacklightTime(0x01, 1)],
    ['FF551101220000000171', cmd.setPrice(0x01, 0)],
    ['FF551101310000000007', cmd.setup(0x01)],
    ['FF551101320000000000', cmd.enter(0x01)],
    ['FF551103110000000061', cmd.setPlus(0x03)],
    ['FF551103120000000062', cmd.setMinus(0x03)],
    ['FF551101330000000001', cmd.setPlus(0x01)],
    ['FF551101340000000002', cmd.setMinus(0x01)],
  ];
  for (const [expected, result] of entries) {
    it(expected, () => {
      assert.equalBytes(result, expected);
    });
  }
});
