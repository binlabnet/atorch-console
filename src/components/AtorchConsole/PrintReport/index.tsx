/* eslint-disable react/jsx-key */
import _ from 'lodash';
import React from 'react';
import { useDispatch } from 'react-redux';
import { Button, Row } from 'reactstrap';
import { sendCommand } from '../../../actions/atorch';
import {
  ACMeterPacket,
  CommandSet,
  DCMeterPacket,
  MeterPacketType,
  USBMeterPacket,
} from '../../../service/atorch-packet';
import locals from './index.scss';
import { Report } from './Report';
import { Toolbar } from './Toolbar';
import { FormattedUnit } from './utils';

interface Props {
  packet?: MeterPacketType;
}

const CO2Name = (
  <span>
    CO<sub>2</sub>
  </span>
);

export const PrintReport: React.FC<Props> = ({ packet }) => {
  let type: number;
  let record: React.ReactNode[][];
  if (packet instanceof ACMeterPacket) {
    type = ACMeterPacket.type;
    record = [
      ['Voltage', <FormattedUnit value={packet.mVoltage} unit='V' />],
      ['Ampere', <FormattedUnit value={packet.mAmpere} unit='A' />],
      ['Watt', <FormattedUnit value={packet.mWatt} unit='W' />],
      [
        'W·h',
        <FormattedUnit value={packet.mWh} unit='W·h' />,
        <Command
          hidden={packet.mWh === 0}
          onClick={CommandSet.resetWh.bind(null, type)}
        >
          Reset
        </Command>,
      ],
      [CO2Name, <FormattedUnit value={packet.co2} unit='g' />],
      ['Price', packet.price.toFixed(2), <SetupPriceCommand type={type} />],
      ['Fee', packet.fee.toFixed(5)],
      ['Frequency', `${packet.frequency.toFixed(1)} Hz`],
      ['PF', packet.pf.toFixed(2)],
      ['Temperature', <FormattedTemperature value={packet.temperature} />],
      ['Duration', packet.duration],
      [
        'Backlight Time',
        <FormattedBacklightTime time={packet.backlightTime} />,
        <SetupBacklightTimeCommand type={type} />,
      ],
    ];
  } else if (packet instanceof DCMeterPacket) {
    type = DCMeterPacket.type;
    record = [
      ['Voltage', <FormattedUnit value={packet.mVoltage} unit='V' />],
      ['Ampere', <FormattedUnit value={packet.mAmpere} unit='A' />],
      ['Watt', <FormattedUnit value={packet.mWatt} unit='W' />],
      [
        'W·h',
        <FormattedUnit value={packet.mWh} unit='W·h' />,
        <Command
          hidden={packet.mWh === 0}
          onClick={CommandSet.resetWh.bind(null, type)}
        >
          Reset
        </Command>,
      ],
      [CO2Name, <FormattedUnit value={packet.co2} unit='g' />],
      ['Price', packet.price.toFixed(2), <SetupPriceCommand type={type} />],
      ['Fee', packet.fee.toFixed(5)],
      ['Temperature', <FormattedTemperature value={packet.temperature} />],
      ['Duration', packet.duration],
      [
        'Backlight Time',
        <FormattedBacklightTime time={packet.backlightTime} />,
        <SetupBacklightTimeCommand type={type} />,
      ],
    ];
  } else if (packet instanceof USBMeterPacket) {
    type = USBMeterPacket.type;
    record = [
      ['Voltage', <FormattedUnit value={packet.mVoltage} unit='V' />],
      ['Ampere', <FormattedUnit value={packet.mAmpere} unit='A' />],
      ['Watt', <FormattedUnit value={packet.mWatt} unit='W' />],
      [
        'A·h',
        <FormattedUnit value={packet.mAh} unit='A·h' />,
        <Command
          hidden={packet.mAh === 0}
          onClick={CommandSet.resetAh.bind(null, type)}
        >
          Reset
        </Command>,
      ],
      [
        'W·h',
        <FormattedUnit value={packet.mWh} unit='W·h' />,
        <Command
          hidden={packet.mWh === 0}
          onClick={CommandSet.resetWh.bind(null, type)}
        >
          Reset
        </Command>,
      ],
      [CO2Name, <FormattedUnit value={packet.co2} unit='g' />],
      ['USB D-', <FormattedUnit value={packet.dataN} unit='V' />],
      ['USB D+', <FormattedUnit value={packet.dataP} unit='V' />],
      ['Temperature', <FormattedTemperature value={packet.temperature} />],
      [
        'Duration',
        packet.duration,
        <Command
          hidden={packet.duration === '000:00:00'}
          onClick={CommandSet.resetDuration.bind(null, type)}
        >
          Reset
        </Command>,
      ],
      [
        'Backlight Time',
        <FormattedBacklightTime time={packet.backlightTime} />,
      ],
    ];
  } else {
    return <p>Not connected to device.</p>;
  }
  return (
    <>
      <Row className='ml-2 justify-content-center'>
        <Report record={record} />
      </Row>
      <Row className='ml-2 justify-content-center'>
        <Toolbar type={type} />
      </Row>
    </>
  );
};

const Command: React.FC<{
  hidden?: boolean;
  onClick: () => Buffer | undefined;
}> = (props) => {
  const dispatch = useDispatch();
  const handleClick = () => {
    dispatch(sendCommand(props.onClick()));
  };
  if (props.hidden) {
    return null;
  }
  return (
    <Button color='link' size='sm' className={locals.btn} onClick={handleClick}>
      {props.children}
    </Button>
  );
};

const SetupPriceCommand: React.FC<{ type: number }> = ({ type }) => {
  const onClick = () => {
    const price = prompt('Setup Price (0 to 999.99)', 0, 0, 1000);
    if (price === undefined) {
      alert(`input unexpected (0 to 999.99)`);
      return;
    }
    return CommandSet.setPrice(type, _.toFinite(price * 100));
  };
  return <Command onClick={onClick}>Setup</Command>;
};

const SetupBacklightTimeCommand: React.FC<{ type: number }> = ({ type }) => {
  const onClick = () => {
    const time = prompt('Setup Backlight Time (0 to 60)', 0, 0, 60.01);
    if (time === undefined) {
      alert(`input unexpected (0 to 60)`);
      return;
    }
    return CommandSet.setBacklightTime(type, _.toFinite(time));
  };
  return <Command onClick={onClick}>Setup</Command>;
};

const FormattedTemperature: React.FC<{ value: number }> = ({ value }) => (
  <span>
    <span>{value} &#8451;</span>, <span>{(value * 9) / 5 + 32} &#8457;</span>
  </span>
);

const FormattedBacklightTime: React.FC<{ time: number }> = ({ time }) => {
  if (time === 0) {
    return <span>Normally Closed</span>;
  } else if (time === 60) {
    return <span>Normally Open</span>;
  } else {
    return <span>{time} sec</span>;
  }
};

function prompt(
  message: string,
  defaultValue: number,
  minValue: number,
  maxValue: number,
) {
  const returns = globalThis.prompt(message, String(defaultValue));
  const price = Number.parseInt(returns ?? '-1', 10);
  if (!_.inRange(price, minValue, maxValue)) {
    return;
  }
  return price;
}
