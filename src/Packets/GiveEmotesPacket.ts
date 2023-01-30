import { BufWrapper } from '@minecraft-js/bufwrapper';

import Packet from './Packet';

export default class GiveEmotesPacket extends Packet<GiveEmotes> {
  public static readonly id = 57;

  public constructor(buf?: BufWrapper) {
    super(buf);
  }

  public write(data: GiveEmotes): void {
    this.data = data;

    this.buf = new BufWrapper(null, { oneConcat: true });
    this.buf.writeVarInt(GiveEmotesPacket.id); // Packet ID

    this.buf.writeVarInt(data.owned.length);
    for (const emote of data.owned) this.buf.writeVarInt(emote);

    this.buf.writeVarInt(data.equipped.length);
    for (const emote of data.equipped) this.buf.writeVarInt(emote);

    this.buf.writeBytes([0x44]); // Don't ask me why I don't fucking know yet

    this.buf.finish();
  }

  public read(): void {
    const ownedLength = this.buf.readVarInt();
    const owned: number[] = [];
    for (let i = 0; i < ownedLength; i++) owned.push(this.buf.readVarInt());

    const equippedLength = this.buf.readVarInt();
    const equipped: number[] = [];
    for (let i = 0; i < equippedLength; i++)
      equipped.push(this.buf.readVarInt());

    this.data = {
      owned,
      equipped,
    };
  }
}

interface GiveEmotes {
  owned: number[];
  equipped: number[];
}
